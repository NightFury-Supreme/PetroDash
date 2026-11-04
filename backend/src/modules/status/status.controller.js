const statusService = require('./status.service');
const { subscribeLocalEvent } = require('../../lib/redis');

class StatusController {
  async getSystemStatus(req, res, next) {
    try {
      const result = await statusService.getSystemStatus();
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async streamStatus(req, res, next) {
    try {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (res.flushHeaders) res.flushHeaders();

      const initialStatus = await statusService.getSystemStatus();
      res.write(`data: ${JSON.stringify({ type: 'STATUS_SNAPSHOT', data: initialStatus })}\n\n`);
      if (res.flush) res.flush();

      const unsubscribe = subscribeLocalEvent('system:status', (payload) => {
        const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
        res.write(`data: ${dataStr}\n\n`);
        if (res.flush) res.flush();
      });

      const pingInterval = setInterval(() => {
        res.write(': ping\n\n');
        if (res.flush) res.flush();
      }, 15000);

      req.on('close', () => {
        clearInterval(pingInterval);
        unsubscribe();
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatusController();
