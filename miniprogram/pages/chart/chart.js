const app = getApp();

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
    },
    personStats: [], // 个人统计数据
    personTotal: { // 个人统计总计
      pendingCount: 0,
      solvedCount: 0,
      rate: '0%'
    }
  },

  onLoad: function () {
    // 在页面加载时调用获取数据函数
    this.getPostData();
    this.getTodoStats();
  },

  // 获取待办统计
  async getTodoStats() {
    try {
      const db = wx.cloud.database();
      const _ = db.command;

      console.log('开始获取待办统计');

      // 获取所有用户
      const res = await app.$api.getUserlist({
        page: 1,
        limit: 999999
      });

      if (!res.code) {
        console.error('获取用户列表失败:', res);
        return;
      }

      const users = res.data || [];
      console.log('获取到用户数量:', users.length);

      // 获取帖子总数
      const { total: postTotal } = await db.collection('post').count();
      console.log('帖子总数:', postTotal);

      // 分页获取所有帖子，按更新时间降序排序
      const MAX_LIMIT = 20;
      const postBatchTimes = Math.ceil(postTotal / MAX_LIMIT);
      const posts = [];
      
      // 串行获取所有帖子，避免并发请求过多
      for (let i = 0; i < postBatchTimes; i++) {
        const { data } = await db.collection('post')
          .orderBy('updateTime', 'desc')  // 添加排序以利用索引
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        
        posts.push(...data);
        console.log(`已获取 ${posts.length}/${postTotal} 个帖子`);
      }

      console.log('获取到的帖子总数:', posts.length);

      const personStats = [];
      const personTotal = {
        pendingCount: 0,
        solvedCount: 0,
        rate: '0%'
      };

      // 为每个用户统计待办数量
      for (const user of users) {
        // 跳过没有 username 或 quxian 的用户
        if (!user.username || !user.quxian) {
          continue;
        }

        const userTag = `@${user.username}${user.quxian}`;
        
        try {
          // 统计该用户的待办数量
          const userPosts = posts.filter(post => {
            if (!post.commentList || !post.commentList.length) return false;

            // 找到最后一个@该用户的评论
            const lastMention = [...post.commentList]
              .reverse()
              .find(comment => 
                comment.content && 
                comment.content.includes(userTag)
              );

            // 如果最后一个@是这个用户，且帖子未解决，则计入待办
            return lastMention !== undefined && post['当前状态'] !== '已解决';
          });

          // 分别计算待办和已解决的数量
          const pendingCount = userPosts.length;
          const solvedPosts = posts.filter(post => {
            if (!post.commentList || !post.commentList.length || post['当前状态'] !== '已解决') return false;

            // 找到最后一个@该用户的评论
            const lastMention = [...post.commentList]
              .reverse()
              .find(comment => 
                comment.content && 
                comment.content.includes(userTag)
              );

            return lastMention !== undefined;
          });
          const solvedCount = solvedPosts.length;

          const stats = {
            username: user.username,
            pendingCount,
            solvedCount,
            rate: '0%'
          };

          const totalCount = stats.pendingCount + stats.solvedCount;
          if (totalCount > 0) {
            stats.rate = Math.round((stats.solvedCount / totalCount) * 100) + '%';
            personStats.push(stats);

            personTotal.pendingCount += stats.pendingCount;
            personTotal.solvedCount += stats.solvedCount;
          }
        } catch (err) {
          console.error('统计用户待办时出错:', user.username, err);
        }
      }

      // 计算总处理率
      const totalCount = personTotal.pendingCount + personTotal.solvedCount;
      personTotal.rate = totalCount > 0 ? 
        Math.round((personTotal.solvedCount / totalCount) * 100) + '%' : '0%';

      // 按待办数量降序排序
      personStats.sort((a, b) => b.pendingCount - a.pendingCount);

      console.log('统计完成，共有待办的用户数:', personStats.length);

      this.setData({
        personStats,
        personTotal
      });

    } catch (error) {
      console.error('获取待办统计失败:', error);
    }
  },
  
  // 添加下拉刷新处理函数
  async onPullDownRefresh() {
    try {
      wx.showNavigationBarLoading(); // 显示导航栏加载动画

      // 重新获取数据
      await Promise.all([
        this.getPostData(),
        this.getTodoStats()
      ]);

      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    } catch (error) {
      console.error('刷新失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'error',
        duration: 1000
      });
    } finally {
      // 停止下拉刷新动画
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
    }
  },

  // 修改 getPostData 方法，使其返回 Promise
  getPostData: function() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      const _ = db.command;

      // 先获取所有用户
      db.collection('user').where({
        isGrant: 'true'  // 只统计已审核的用户
      }).get().then(userRes => {
        const users = userRes.data;
        
        // 获取所有帖子
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
      
            // 部门统计
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

              counts.total = counts.A + counts.B + counts.C + counts.D + counts.E;
              counts.rate = counts.total > 0 ? Math.round((counts.E / counts.total) * 100) + '%' : '0%';
              tableData.push(counts);
            });

            total.total = total.A + total.B + total.C + total.D + total.E;
            total.rate = total.total > 0 ? Math.round((total.E / total.total) * 100) + '%' : '0%';

            this.setData({
              tableData,
              total
            });
            resolve(); // 完成后 resolve
          }).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  }
});