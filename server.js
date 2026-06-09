const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- JSON file database ----
const DB_FILE = path.join(__dirname, 'data.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('读取数据库失败，返回空数据:', e.message);
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(__dirname));

// ==================== API ROUTES ====================

// Submit a new signup
app.post('/api/signups', (req, res) => {
  try {
    const { name, classInfo, gender, phone, timeSlot, political } = req.body;

    // Validation
    if (!name || !classInfo || !gender || !phone || !political) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    const signups = readDB();
    const newSignup = {
      id: Date.now(),
      name: name.trim(),
      gender: gender.trim(),
      political: (political || '').trim(),
      classInfo: classInfo.trim(),
      phone: phone.trim(),
      timeSlot: (timeSlot || '').trim(),
      submittedAt: new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }),
      ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
    };

    signups.push(newSignup);
    writeDB(signups);

    console.log(`✅ 新报名: ${newSignup.name} (${newSignup.classInfo}) - 总计: ${signups.length}`);

    res.json({
      success: true,
      id: newSignup.id,
      total: signups.length,
      message: '报名成功！感谢您的爱心 ❤️'
    });
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// ---- Admin auth middleware ----
const ADMIN_KEY = 'blood2026';

function requireAdmin(req, res, next) {
  const key = req.query.adminKey || req.headers['x-admin-key'] || '';
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权访问，请提供正确的管理员密钥' });
  }
  next();
}

// Get all signups (admin only)
app.get('/api/signups', requireAdmin, (req, res) => {
  try {
    const signups = readDB();
    signups.reverse();
    res.json(signups);
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get stats (admin only)
app.get('/api/stats', requireAdmin, (req, res) => {
  try {
    const signups = readDB();
    const total = signups.length;
    const maleCount = signups.filter(d => d.gender === '男').length;
    const femaleCount = signups.filter(d => d.gender === '女').length;

    // Today's count
    const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const todayCount = signups.filter(d => d.submittedAt && d.submittedAt.includes(today)).length;

    res.json({ total, male: maleCount, female: femaleCount, today: todayCount });
  } catch (err) {
    console.error('统计失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Delete all signups (with admin key)
app.delete('/api/signups', (req, res) => {
  try {
    const { adminKey } = req.query;
    if (adminKey !== 'blood2026') {
      return res.status(403).json({ error: '无权限' });
    }
    writeDB([]);
    console.log('🗑 所有数据已清空');
    res.json({ success: true, message: '所有数据已清空' });
  } catch (err) {
    console.error('清空失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Delete single signup (admin only)
app.delete('/api/signups/:id', (req, res) => {
  try {
    const key = req.query.adminKey || req.headers['x-admin-key'] || '';
    if (key !== ADMIN_KEY) return res.status(403).json({ error: '无权限' });
    const signups = readDB();
    const idx = signups.findIndex(s => s.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: '记录不存在' });
    const removed = signups.splice(idx, 1)[0];
    writeDB(signups);
    console.log(`🗑 已删除: ${removed.name} (${removed.classInfo})`);
    res.json({ success: true, message: `已删除 ${removed.name} 的报名` });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ==================== ADMIN PAGE ====================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==================== Start server ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log('  🩸  无偿献血报名后端已启动');
  console.log('═══════════════════════════════════════');
  console.log(`  📝 报名页:  http://localhost:${PORT}`);
  console.log(`  📊 管理后台: http://localhost:${PORT}/admin`);
  console.log(`  📡 API地址:  http://localhost:${PORT}/api/signups`);
  console.log(`  💾 数据文件: ${DB_FILE}`);
  console.log('═══════════════════════════════════════');
});
