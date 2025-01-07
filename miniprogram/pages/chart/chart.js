Page({
  data: {
    tableData: [], // 初始化表格数据
    total: { // 初始化总计对象
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      total: 0,
      rate: '0%'
    }
  },

  onLoad: function () {
    // 在页面加载时调用获取数据函数
    this.getPostData();
  },
  
  getPostData: function () {
    const db = wx.cloud.database();
    const _ = db.command;
  
    const MAX_LIMIT = 20;
    db.collection('post').count().then(res => {
      const totalCount = res.total;
      const batchTimes = Math.ceil(totalCount / MAX_LIMIT);
  
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('post').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
        tasks.push(promise);
      }
  
      Promise.all(tasks).then(res => {
        const posts = [];
        res.forEach(item => {
          posts.push(...item.data);
        });
  
        const authorList = [...new Set(posts.map(item => item.author_belong))];
        const tableData = [];
        const total = {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          E: 0,
          total: 0,
          rate: '0%'
        };
  
        authorList.forEach(author => {
          const counts = {
            author: author,
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            E: 0,
            total: 0,
            rate: '0%'
          };
  
          posts.forEach(item => {
            if (item.author_belong === author) {
              switch (item['当前状态']) {
                case '待回复':
                  counts.A++;
                  total.A++;
                  break;
                case '规划中':
                  counts.B++;
                  total.B++;
                  break;
                case '建设中':
                  counts.C++;
                  total.C++;
                  break;
                case '暂挂中':
                  counts.D++;
                  total.D++;
                  break;
                case '已解决':
                  counts.E++;
                  total.E++;
                  break;
                default:
                  break;
              }
            }
          });

          // 计算每行的总计和解决率
          counts.total = counts.A + counts.B + counts.C + counts.D + counts.E;
          counts.rate = counts.total > 0 ? Math.round((counts.E / counts.total) * 100) + '%' : '0%';
          tableData.push(counts);
        });

        // 计算总计行的总计和解决率
        total.total = total.A + total.B + total.C + total.D + total.E;
        total.rate = total.total > 0 ? Math.round((total.E / total.total) * 100) + '%' : '0%';
  
        this.setData({
          tableData: tableData,
          total: total
        });
      }).catch(err => {
        console.error('获取数据失败：', err);
      });
    }).catch(err => {
      console.error('获取数据总数失败：', err);
    });
  }
});