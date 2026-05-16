const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../utils/activityLog');

const prisma = new PrismaClient();

const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { where: { userId: req.user.id } }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.length > 0;
    if (req.user.role !== 'SUPER_ADMIN' && !isMember) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    const isAdmin = req.user.role === 'SUPER_ADMIN' || (project.members.length > 0 && project.members[0].role === 'ADMIN');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admin or super admin can upload project documents' });
    }

    const documents = await Promise.all(
      req.files.map(file =>
        prisma.projectDocument.create({
          data: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            path: file.filename,
            projectId,
            uploadedById: req.user.id
          },
          include: {
            uploadedBy: { select: { id: true, name: true } }
          }
        })
      )
    );

    res.status(201).json(documents);
    await logActivity(req.user.id, 'UPLOAD', 'Project', projectId, `Uploaded ${documents.length} document(s) to project`);
  } catch (error) {
    next(error);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documents = await prisma.projectDocument.findMany({
      where: { projectId },
      include: {
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          include: {
            members: { where: { userId: req.user.id } }
          }
        }
      }
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const isAdmin = req.user.role === 'SUPER_ADMIN' || (document.project.members.length > 0 && document.project.members[0].role === 'ADMIN');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admin or super admin can delete documents' });
    }

    const filePath = path.join(__dirname, '../../uploads', document.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.projectDocument.delete({ where: { id: documentId } });
    res.json({ message: 'Document deleted' });
    await logActivity(req.user.id, 'DELETE', 'Project', document.projectId, `Deleted document "${document.name}"`);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadMultiple, getByProject, remove };
