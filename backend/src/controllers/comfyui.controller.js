const comfyuiService = require('../services/comfyui.service');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

class ComfyUIController {
  // 处理图片生成请求
  async processImage(req, res) {
    try {
      const { workflow } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file provided'
        });
      }

      // 验证图片
      await comfyuiService.validateImage(imageFile);

      // 处理图片
      const result = await comfyuiService.processImage(imageFile, workflow);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('format')) statusCode = 400;
      if (error.message.includes('size')) statusCode = 413;

      res.status(statusCode).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // 获取处理状态
  async getStatus(req, res) {
    try {
      const { taskId } = req.params;
      const status = await comfyuiService.getTaskStatus(taskId);
      
      res.json({
        status: 'success',
        data: status
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // 取消处理任务
  async cancelTask(req, res) {
    try {
      const { taskId } = req.params;
      await comfyuiService.cancelTask(taskId);
      
      res.json({
        status: 'success',
        message: 'Task cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = new ComfyUIController(); 