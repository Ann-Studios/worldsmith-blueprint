import { Board, IBoard, IPermission } from '../src/models/Board';
import { Card } from '../src/models/Card';
import { Connection } from '../src/models/Connection';
import { Comment } from '../src/models/Comment';

export class BoardService {
  // Get user's accessible boards
  static async getUserBoards(userId: string) {
    return Board.find({
      $or: [
        { createdBy: userId },
        { 'permissions.userId': userId },
        { isPublic: true }
      ]
    }).sort({ updatedAt: -1 });
  }

  // Get complete board data with cards, connections, and comments
  static async getBoardWithData(boardId: string, userId: string) {
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { createdBy: userId },
        { 'permissions.userId': userId },
        { isPublic: true }
      ]
    });

    if (!board) {
      throw new Error('Board not found or access denied');
    }

    const [cards, connections, comments] = await Promise.all([
      Card.find({ boardId }),
      Connection.find({ boardId }),
      Comment.find({ boardId })
    ]);

    return {
      board,
      cards,
      connections,
      comments
    };
  }

  // Create a new board
  static async createBoard(boardData: Partial<IBoard>, userId: string) {
    const board = new Board({
      ...boardData,
      createdBy: userId,
      permissions: [{
        userId,
        role: 'owner',
        grantedBy: userId,
        grantedAt: new Date()
      }]
    });

    return board.save();
  }

  // Update board permissions
  static async updateBoardPermissions(boardId: string, permissions: IPermission[], userId: string) {
    const board = await Board.findOne({
      _id: boardId,
      createdBy: userId // Only owner can update permissions
    });

    if (!board) {
      throw new Error('Board not found or permission denied');
    }

    board.permissions = permissions;
    return board.save();
  }
}