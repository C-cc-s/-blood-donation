const TOKEN = process.env.GH_TOKEN || '';
const REPO = 'C-cc-s/-blood-donation';
const FILE = 'data.json';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var api = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE;

  // POST - submit new signup
  if (req.method === 'POST') {
    if (!TOKEN) return res.status(500).json({ error: 'Token not configured' });
    try {
      var fd = req.body;
      if (!fd.name || !fd.classInfo || !fd.gender || !fd.phone || !fd.political)
        return res.status(400).json({ error: '请填写所有必填字段' });

      var g = await fetch(api);
      var gj = await g.json();
      var data = JSON.parse(Buffer.from(gj.content, 'base64').toString('utf-8'));
      data.signups.push({
        name:fd.name, gender:fd.gender, political:fd.political,
        classInfo:fd.classInfo, phone:fd.phone, timeSlot:fd.timeSlot||'',
        submittedAt:new Date().toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'})
      });
      var content = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
      var r = await fetch(api, {
        method:'PUT',
        headers:{'Authorization':'token '+TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({message:'报名: '+fd.name,content:content,sha:gj.sha})
      });
      if (!r.ok) throw new Error('GitHub API error');
      return res.json({ success:true, message:'报名成功！' });
    } catch(e) {
      return res.status(500).json({ error:e.message });
    }
  }

  // GET - list signups
  if (req.method === 'GET') {
    try {
      var g = await fetch(api);
      var gj = await g.json();
      var data = JSON.parse(Buffer.from(gj.content, 'base64').toString('utf-8'));
      return res.json(data.signups || []);
    } catch(e) {
      return res.status(500).json({ error:e.message });
    }
  }

  return res.status(405).json({ error:'Method not allowed' });
};
