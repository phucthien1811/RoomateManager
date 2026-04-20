const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/:postId', authenticate, postController.getPostDetail);
router.put('/:postId', authenticate, postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);

module.exports = router;
