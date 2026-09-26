const User = require('../../../models/User');
const Server = require('../../../models/Server');
const Egg = require('../../../models/Egg');
const Location = require('../../../models/Location');
const UserPlan = require('../../../models/UserPlan');
const Ticket = require('../../../models/Ticket');
const TicketMessage = require('../../../models/TicketMessage');
const AuditLog = require('../../../models/AuditLog');
const Payment = require('../../../models/Payment');

exports.fetchPrevData = async (prevStartDate, startDate) => {
  return Promise.all([
    User.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Server.countDocuments({ status: 'active', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Payment.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lt: startDate } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$amount", 0] } },
          refunds: { $sum: { $cond: [{ $eq: ["$status", "REFUNDED"] }, "$amount", 0] } },
          purchases: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }
        }
      }
    ]),
    AuditLog.countDocuments({ action: 'admin.user.delete', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    User.countDocuments({ referredBy: { $ne: null }, createdAt: { $gte: prevStartDate, $lt: startDate } }),
    UserPlan.countDocuments({ status: 'active', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    AuditLog.countDocuments({ action: 'server.delete', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Ticket.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Ticket.countDocuments({ status: 'open', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Ticket.countDocuments({ status: 'pending', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Ticket.countDocuments({ status: 'resolved', createdAt: { $gte: prevStartDate, $lt: startDate } }),
    User.countDocuments({ referredBy: { $ne: null }, createdAt: { $gte: startDate } }),
    UserPlan.countDocuments({ status: 'active', createdAt: { $gte: startDate } }),
    Ticket.countDocuments({ createdAt: { $gte: startDate } }),
    Ticket.countDocuments({ status: 'open', createdAt: { $gte: startDate } }),
    Ticket.countDocuments({ status: 'pending', createdAt: { $gte: startDate } }),
    Ticket.countDocuments({ status: 'resolved', createdAt: { $gte: startDate } }),
    Server.countDocuments({ status: 'active', createdAt: { $gte: startDate } }),
  ]);
};

exports.fetchAggregateData = async (startDate) => {
  return Promise.all([
    User.countDocuments({}),
    Server.countDocuments({ status: 'active' }),
    Egg.countDocuments({}),
    Location.countDocuments({}),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Server.aggregate([
      { $group: { _id: '$eggId', count: { $sum: 1 } } },
      { $lookup: { from: 'eggs', localField: '_id', foreignField: '_id', as: 'egg' } },
      { $unwind: { path: '$egg', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, eggId: '$_id', name: '$egg.name', count: 1 } }
    ]),
    Server.aggregate([
      { $group: { _id: '$locationId', count: { $sum: 1 } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, locationId: '$_id', name: '$location.name', count: 1 } }
    ]),
    User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    Server.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    AuditLog.aggregate([{ $match: { action: 'server.delete', createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    AuditLog.aggregate([{ $match: { action: 'admin.user.delete', createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: { status: 'resolved', updatedAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: { status: 'closed', closedAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt" } }, count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { referredBy: { $ne: null }, createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, "$amount", 0] } },
          refunds: { $sum: { $cond: [{ $eq: ["$status", "REFUNDED"] }, "$amount", 0] } },
          purchases: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }
        }
      }
    ]),
    UserPlan.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            planName: "$plan.name"
          },
          count: { $sum: 1 }
        }
      }
    ]),
    Server.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $lookup: { from: 'eggs', localField: 'eggId', foreignField: '_id', as: 'egg' } },
      { $unwind: { path: '$egg', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            eggName: "$egg.name"
          },
          count: { $sum: 1 }
        }
      }
    ]),
    Payment.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$plan.name",
          purchases: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      }
    ]),
    UserPlan.countDocuments({ status: 'active' }),
    User.countDocuments({ referredBy: { $ne: null } }),
    Ticket.aggregate([
      { $match: { status: { $in: ['resolved', 'closed'] } } },
      { $project: { duration: { $subtract: ['$updatedAt', '$createdAt'] } } },
      { $group: { _id: null, avgRes: { $avg: '$duration' } } }
    ]),
    TicketMessage.aggregate([
      { $match: { authorRole: 'admin' } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$ticket', firstReplyAt: { $first: '$createdAt' } } },
      { $lookup: { from: 'tickets', localField: '_id', foreignField: '_id', as: 't' } },
      { $unwind: '$t' },
      { $project: { duration: { $subtract: ['$firstReplyAt', '$t.createdAt'] } } },
      { $group: { _id: null, avgResp: { $avg: '$duration' } } }
    ]),
    Ticket.aggregate([
      { $match: { status: { $in: ['resolved', 'closed'] }, updatedAt: { $gte: startDate } } },
      { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, duration: { $subtract: ['$updatedAt', '$createdAt'] } } },
      { $group: { _id: '$day', avgRes: { $avg: '$duration' } } }
    ]),
    TicketMessage.aggregate([
      { $match: { authorRole: 'admin', createdAt: { $gte: startDate } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$ticket', firstReplyAt: { $first: '$createdAt' } } },
      { $lookup: { from: 'tickets', localField: '_id', foreignField: '_id', as: 't' } },
      { $unwind: '$t' },
      { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$firstReplyAt" } }, duration: { $subtract: ['$firstReplyAt', '$t.createdAt'] } } },
      { $group: { _id: '$day', avgResp: { $avg: '$duration' } } }
    ])
  ]);
};
