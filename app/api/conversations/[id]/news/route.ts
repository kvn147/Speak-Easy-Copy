import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase/adminConfig';
import { readConversationFile } from '@/app/lib/markdown';
import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';

const parser = new Parser();

// Topic categories with their RSS feeds
const TOPIC_RSS_FEEDS: { [key: string]: string[] } = {
  sports: [
    'https://www.espn.com/espn/rss/news',
    'https://www.sportingnews.com/us/rss',
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'http://rss.cnn.com/rss/edition_sport.rss',
    'https://www.cbssports.com/rss/headlines',
  ],
  finance: [
    'https://feeds.finance.yahoo.com/rss/2.0/headline',
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'http://rss.cnn.com/rss/money_latest.rss',
    'https://www.marketwatch.com/rss/topstories',
  ],
  health: [
    'https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
    'https://www.medicalnewstoday.com/rss/news.xml',
    'http://rss.cnn.com/rss/cnn_health.rss',
    'https://feeds.bbci.co.uk/news/health/rss.xml',
    'https://www.healthline.com/feeds/rss',
  ],
  politics: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
    'http://rss.cnn.com/rss/cnn_allpolitics.rss',
    'https://feeds.bbci.co.uk/news/politics/rss.xml',
    'https://www.politico.com/rss/politics08.xml',
    'https://thehill.com/rss/syndicator/19109',
  ],
  technology: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://www.wired.com/feed/rss',
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
  ],
  entertainment: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml',
    'http://rss.cnn.com/rss/cnn_showbiz.rss',
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    'https://www.hollywoodreporter.com/feed/',
    'https://variety.com/feed/',
  ],
  science: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    'https://www.sciencedaily.com/rss/all.xml',
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'http://feeds.nature.com/nature/rss/current',
    'https://www.space.com/feeds/all',
  ],
  business: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    'http://rss.cnn.com/rss/money_latest.rss',
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.forbes.com/business/feed/',
    'https://www.cnbc.com/id/10001147/device/rss/rss.html',
  ],
  world: [
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'http://rss.cnn.com/rss/edition_world.rss',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://www.theguardian.com/world/rss',
  ],
  education: [
    'https://www.insidehighered.com/rss/all',
    'https://hechingerreport.org/feed/',
    'https://www.chronicle.com/section/News/6/?cid=rclink',
    'https://www.edweek.org/rss.xml',
    'https://www.educationnews.org/feed/',
  ],
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id: conversationId } = await context.params;

    // Read the conversation
    const conversation = await readConversationFile(userId, conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Step 1: Use Gemini to determine relevant topics from the conversation
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const availableTopics = Object.keys(TOPIC_RSS_FEEDS).join(', ');
    const topicPrompt = `Based on this conversation, select 1-3 most relevant topics from this list: ${availableTopics}

Return ONLY the topic names separated by commas, nothing else. Choose topics that would help find relevant news articles for this conversation.

Conversation:
${conversation.content.substring(0, 2000)}`;
    
    const topicsResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: topicPrompt,
    });

    const selectedTopicsText = topicsResponse.text.trim().toLowerCase();
    const selectedTopics = selectedTopicsText
      .split(',')
      .map(t => t.trim())
      .filter(t => TOPIC_RSS_FEEDS[t]);

    if (selectedTopics.length === 0) {
      return NextResponse.json({
        success: true,
        headlines: [],
        message: 'No relevant topics found',
      });
    }

    console.log('📂 Selected topics:', selectedTopics);

    // Step 2: Fetch articles from RSS feeds for selected topics
    const allHeadlines: any[] = [];
    
    for (const topic of selectedTopics) {
      const feeds = TOPIC_RSS_FEEDS[topic];
      
      // Use up to 5 feeds per topic
      const feedsToUse = feeds.slice(0, 5);
      
      for (const feedUrl of feedsToUse) {
        try {
          console.log(`🔍 Fetching ${topic} feed: ${feedUrl}`);
          const feed = await parser.parseURL(feedUrl);
          
          // Get top 3 most recent articles from this feed
          const articles = feed.items.slice(0, 3).map((item: any) => ({
            title: item.title || '',
            description: item.contentSnippet || item.content?.substring(0, 200) || '',
            url: item.link || '',
            source: feed.title || 'Unknown Source',
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            topic: topic,
          }));
          
          allHeadlines.push(...articles);
          console.log(`✅ Found ${articles.length} headlines from ${feed.title}`);
        } catch (error) {
          console.error(`❌ Error parsing feed ${feedUrl}:`, error);
        }
      }
    }

    if (allHeadlines.length === 0) {
      return NextResponse.json({
        success: true,
        headlines: [],
        topics: selectedTopics,
        message: 'No articles found for selected topics',
      });
    }

    console.log(`📰 Total headlines found: ${allHeadlines.length}`);

    // Sort by date (most recent first)
    allHeadlines.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Step 3: Use Gemini to select the top 3 most relevant headlines
    const headlinesContext = allHeadlines
      .slice(0, 15) // Consider top 15 for selection
      .map((article, idx) => 
        `${idx + 1}. ${article.title} (${article.topic} - ${article.source})`
      )
      .join('\n');

    const selectionPrompt = `Based on this conversation context, select the 3 MOST relevant headline numbers from the list below. Reply with ONLY the numbers separated by commas (e.g., "1,5,8").

Conversation summary: ${conversation.content.substring(0, 500)}

Headlines:
${headlinesContext}`;

    const selectionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: selectionPrompt,
    });

    const selectedIndices = selectionResponse.text
      .trim()
      .split(',')
      .map(n => parseInt(n.trim()) - 1)
      .filter(n => !isNaN(n) && n >= 0 && n < allHeadlines.length)
      .slice(0, 3);

    // Get the selected headlines
    const recommendedHeadlines = selectedIndices.length > 0
      ? selectedIndices.map(i => allHeadlines[i])
      : allHeadlines.slice(0, 3);

    console.log(`🎯 Selected ${recommendedHeadlines.length} recommended headlines`);

    return NextResponse.json({
      success: true,
      headlines: recommendedHeadlines,
      topics: selectedTopics,
    });

  } catch (error: any) {
    console.error('❌ Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error.message },
      { status: 500 }
    );
  }
}
