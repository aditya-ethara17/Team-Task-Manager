const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const startOrGetConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: 'participantId required' });

    const other = await prisma.user.findUnique({ where: { id: participantId } });
    if (!other) return res.status(404).json({ error: 'User not found' });
    if (other.id === req.user.id) return res.status(400).json({ error: 'Cannot DM yourself' });

    const p1 = req.user.id < other.id ? req.user.id : other.id;
    const p2 = req.user.id < other.id ? other.id : req.user.id;

    const existing = await prisma.conversation.findUnique({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      include: {
        participant1: { select: { id: true, name: true, email: true, role: true } },
        participant2: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (existing) return res.json(existing);

    const conversation = await prisma.conversation.create({
      data: { participant1Id: p1, participant2Id: p2 },
      include: {
        participant1: { select: { id: true, name: true, email: true, role: true } },
        participant2: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ]
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, role: true } },
        participant2: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const since = req.query.since ? new Date(req.query.since) : new Date(0);

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        createdAt: { gt: since }
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, conversationId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        conversationId,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

module.exports = { startOrGetConversation, getMyConversations, getMessages, sendMessage };
