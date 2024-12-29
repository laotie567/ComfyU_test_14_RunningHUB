const express = require('express');
const router = express.Router();
const multer = require('multer');
const comfyuiController = require('../controllers/comfyui.controller');

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 处理图片生成请求
router.post('/process', upload.single('image'), comfyuiController.processImage);

// 获取任务状态
router.get('/status/:taskId', comfyuiController.getStatus);

// 取消任务
router.post('/cancel/:taskId', comfyuiController.cancelTask);

module.exports = router; 