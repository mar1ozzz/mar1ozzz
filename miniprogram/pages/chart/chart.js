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
    },
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆','VIP整治'],
    pickerList: ['全部','运维','综维','传输','优化','建设','资管','集客','光缆','VIP整治'],
    selectedType: '',  // 筛选使用的类型值
    postIndex: {} // 用于存储每个数字对应的帖子ID列表
  },

  typeFilter(e) {
    console.log('选择的索引:', e.detail.value);
    const selectedType = e.detail.value === '0' ? '' : this.data.pickerList[e.detail.value];
    console.log('选择的类型:', selectedType);
    
    this.setData({
      selectedType: selectedType,
      tableData: []  // 清空当前数据
    }, () => {
      // 重新获取数据
      this.getPostData();
      this.getTodoStats();
    });
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

    // 构建查询条件
    let query = {};
    if (this.data.selectedType) {
      query.type = this.data.selectedType;
    }

    // 获取帖子总数
    const { total: postTotal } = await db.collection('post').where(query).count();
    console.log('帖子总数:', postTotal);

    // 分页获取所有帖子，按更新时间降序排序
    const MAX_LIMIT = 20;
    const postBatchTimes = Math.ceil(postTotal / MAX_LIMIT);
    const posts = [];
    
    // 串行获取所有帖子，避免并发请求过多
    for (let i = 0; i < postBatchTimes; i++) {
      const { data } = await db.collection('post')
        .where(query)  // 添加查询条件
        .orderBy('updateTime', 'desc')
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
    const postIndex = this.data.postIndex || {};

    // 为每个用户统计待办数量
    for (const user of users) {
      // 跳过没有 username 或 quxian 的用户
      if (!user.username || !user.quxian) {
        continue;
      }

      const userTag = `@${user.username}${user.quxian}`;
      
      try {
        // 统计该用户的待办数量
        const userPendingPosts = posts.filter(post => {
          if (!post.commentList || !post.commentList.length) return false;

          const lastMention = [...post.commentList]
            .reverse()
            .find(comment => 
              comment.content && 
              comment.content.includes(userTag)
            );

          return lastMention !== undefined && post['当前状态'] !== '已解决';
        });

        const userSolvedPosts = posts.filter(post => {
          if (!post.commentList || !post.commentList.length || post['当前状态'] !== '已解决') return false;

          const lastMention = [...post.commentList]
            .reverse()
            .find(comment => 
              comment.content && 
              comment.content.includes(userTag)
            );

          return lastMention !== undefined;
        });

        const pendingCount = userPendingPosts.length;
        const solvedCount = userSolvedPosts.length;

        // 存储用户的待办和已解决帖子ID
        postIndex[`person_${user.username}_pending`] = userPendingPosts.map(p => p._id);
        postIndex[`person_${user.username}_solved`] = userSolvedPosts.map(p => p._id);

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

    // 存储总计的待办和已解决帖子ID
    const allPendingPosts = [];
    const allSolvedPosts = [];
    personStats.forEach(stat => {
      allPendingPosts.push(...(postIndex[`person_${stat.username}_pending`] || []));
      allSolvedPosts.push(...(postIndex[`person_${stat.username}_solved`] || []));
    });
    postIndex['person_total_pending'] = allPendingPosts;
    postIndex['person_total_solved'] = allSolvedPosts;

    // 计算总处理率
    const totalCount = personTotal.pendingCount + personTotal.solvedCount;
    personTotal.rate = totalCount > 0 ? 
      Math.round((personTotal.solvedCount / totalCount) * 100) + '%' : '0%';

    // 按待办数量降序排序
    personStats.sort((a, b) => b.pendingCount - a.pendingCount);

    console.log('统计完成，共有待办的用户数:', personStats.length);

    this.setData({
      personStats,
      personTotal,
      postIndex
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

  // 修改点击处理函数
  handleCellTap(e) {
    const { type, author, isperson } = e.currentTarget.dataset;
    let key;
    
    if (isperson) {
      key = `person_${author}_${type}`;
    } else {
      key = type === 'total' ? `${author}_total` : `${author}_${type}`;
    }
    
    console.log('点击单元格:', { type, author, key, isperson });
    
    const posts = this.data.postIndex[key] || [];
    console.log('找到的帖子数量:', posts.length, '帖子key:', key);
    
    if (posts.length === 0) {
      wx.showToast({
        title: '没有相关帖子',
        icon: 'none'
      });
      return;
    }

    wx.setStorageSync('filtered_posts', posts);
    console.log('已存储帖子ID列表到缓存:', posts);
    
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 修改 getPostData 方法
getPostData: function() {
  return new Promise((resolve, reject) => {
    const db = wx.cloud.database();
    const _ = db.command;

    db.collection('user').where({
      isGrant: 'true'
    }).get().then(userRes => {
      const users = userRes.data;
      
      const MAX_LIMIT = 20;
      
      // 构建查询条件
      let query = {};
      
      // 如果有选中的类型，添加到查询条件
      if (this.data.selectedType) {
        query.type = this.data.selectedType;
      }
      
      db.collection('post').where(query).count().then(res => {
        const totalCount = res.total;
        const batchTimes = Math.ceil(totalCount / MAX_LIMIT);
    
        const tasks = [];
        for (let i = 0; i < batchTimes; i++) {
          const promise = db.collection('post')
            .where(query)  // 添加查询条件
            .skip(i * MAX_LIMIT)
            .limit(MAX_LIMIT)
            .get();
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
            A: 0, B: 0, C: 0, D: 0, E: 0,
            total: 0,
            rate: '0%'
          };
          
          // 初始化帖子索引
          const postIndex = {};
    
          authorList.forEach(author => {
            const counts = {
              author: author,
              A: 0, B: 0, C: 0, D: 0, E: 0,
              total: 0,
              rate: '0%'
            };

            // 为每个部门的每种状态创建帖子ID列表
            postIndex[`${author}_total`] = []; // 添加部门总计的帖子列表
            postIndex[`${author}_A`] = [];
            postIndex[`${author}_B`] = [];
            postIndex[`${author}_C`] = [];
            postIndex[`${author}_D`] = [];
            postIndex[`${author}_E`] = [];
            
            posts.forEach(item => {
              if (item.author_belong === author) {
                // 添加到部门总计列表
                postIndex[`${author}_total`].push(item._id);
                
                switch (item['当前状态']) {
                  case '待回复':
                    counts.A++;
                    total.A++;
                    postIndex[`${author}_A`].push(item._id);
                    break;
                  case '规划中':
                    counts.B++;
                    total.B++;
                    postIndex[`${author}_B`].push(item._id);
                    break;
                  case '建设中':
                    counts.C++;
                    total.C++;
                    postIndex[`${author}_C`].push(item._id);
                    break;
                  case '暂挂中':
                    counts.D++;
                    total.D++;
                    postIndex[`${author}_D`].push(item._id);
                    break;
                  case '已解决':
                    counts.E++;
                    total.E++;
                    postIndex[`${author}_E`].push(item._id);
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

          // 存储总计的帖子索引
          postIndex['total_total'] = posts.map(p => p._id);
          postIndex['total_A'] = posts.filter(p => p['当前状态'] === '待回复').map(p => p._id);
          postIndex['total_B'] = posts.filter(p => p['当前状态'] === '规划中').map(p => p._id);
          postIndex['total_C'] = posts.filter(p => p['当前状态'] === '建设中').map(p => p._id);
          postIndex['total_D'] = posts.filter(p => p['当前状态'] === '暂挂中').map(p => p._id);
          postIndex['total_E'] = posts.filter(p => p['当前状态'] === '已解决').map(p => p._id);

          this.setData({
            tableData,
            total,
            postIndex
          });
          resolve();
        }).catch(reject);
      }).catch(reject);
    }).catch(reject);
  });
},

  // 将原来的 onLongPress 改为 saveToImage
  async saveToImage() {
    try {
      const query = wx.createSelectorQuery()
      query.selectAll('.table-container').boundingClientRect()
      query.exec(async (res) => {
        if (!res[0] || res[0].length < 2) {
          wx.showToast({
            title: '获取表格失败',
            icon: 'none'
          })
          return
        }

        // 计算实际需要的画布高度
        const totalRows = this.data.tableData.length + this.data.personStats.length + 4 // +4是两个表头和两个总计行
        const cellHeight = 55 // 进一步减小单元格高度
        const tableSpacing = 100 // 两个表格之间的间距
        const canvasHeight = (totalRows * cellHeight) + tableSpacing + 80 // 80px作为上下边距
        
        // 创建离屏canvas，使用更合适的尺寸
        const canvas = wx.createOffscreenCanvas({
          type: '2d',
          width: 900,  // 增加宽度，确保文字不溢出
          height: canvasHeight
        })
        const ctx = canvas.getContext('2d')
        
        // 设置背景色
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 设置文字样式
        ctx.fillStyle = '#000000'
        ctx.font = '24px sans-serif' // 稍微调小字体
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        
        // 绘制第一个表格
        const firstTableHeight = await this.drawTable(ctx, 40, this.data.tableData, this.data.total, [
          '部门/区县', '总计', '待回复', '规划中', '建设中', '暂挂中', '已解决', '解决率'
        ], false, 850) // 增加表格宽度
        
        // 绘制第二个表格
        await this.drawTable(ctx, firstTableHeight + tableSpacing, this.data.personStats, this.data.personTotal, [
          '处理人', '待处理数量', '已处理数量', '处理率'
        ], true, 850)
        
        // 将canvas转为图片
        const tempFilePath = await new Promise((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas,
            width: canvas.width,
            height: canvas.height,
            destWidth: canvas.width,
            destHeight: canvas.height,
            fileType: 'png',
            success: res => resolve(res.tempFilePath),
            fail: reject
          })
        })
        
        // 保存图片到相册
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.error('保存失败:', err)
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      })
    } catch (err) {
      console.error('保存图片错误:', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 修改绘制表格的方法
  async drawTable(ctx, startY, data, totalRow, headers, isPersonTable, tableWidth) {
    // 设置表格样式
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 1
    ctx.textAlign = 'center'
    
    // 计算列宽
    const colWidths = []
    if (isPersonTable) {
      // 个人统计表的列宽分配
      colWidths.push(tableWidth * 0.3) // 处理人
      colWidths.push(tableWidth * 0.25) // 待处理数量
      colWidths.push(tableWidth * 0.25) // 已处理数量
      colWidths.push(tableWidth * 0.2) // 处理率
    } else {
      // 部门统计表的列宽分配
      colWidths.push(tableWidth * 0.25) // 部门/区县
      colWidths.push(tableWidth * 0.1) // 总计
      colWidths.push(tableWidth * 0.1) // 待回复
      colWidths.push(tableWidth * 0.1) // 规划中
      colWidths.push(tableWidth * 0.1) // 建设中
      colWidths.push(tableWidth * 0.1) // 暂挂中
      colWidths.push(tableWidth * 0.1) // 已解决
      colWidths.push(tableWidth * 0.15) // 解决率
    }
    
    const cellHeight = 55 // 进一步减小单元格高度
    let currentY = startY
    
    // 绘制表头
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(25, currentY, tableWidth, cellHeight)
    ctx.strokeRect(25, currentY, tableWidth, cellHeight)
    
    // 绘制表头文字
    ctx.fillStyle = '#000000'
    let currentX = 25
    headers.forEach((header, index) => {
      const x = currentX + colWidths[index]/2
      ctx.fillText(header, x, currentY + (cellHeight/2) + 8)
      currentX += colWidths[index]
      ctx.beginPath()
      ctx.moveTo(currentX, currentY)
      ctx.lineTo(currentX, currentY + cellHeight)
      ctx.stroke()
    })
    
    currentY += cellHeight
    
    // 绘制数据行
    data.forEach((row) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(25, currentY, tableWidth, cellHeight)
      ctx.strokeRect(25, currentY, tableWidth, cellHeight)
      
      currentX = 25
      if (isPersonTable) {
        const values = [row.username, row.pendingCount, row.solvedCount, row.rate]
        values.forEach((value, index) => {
          const x = currentX + colWidths[index]/2
          ctx.fillStyle = index === 1 && value > 0 ? '#ff0000' : '#000000'
          ctx.fillText(value.toString(), x, currentY + (cellHeight/2) + 8)
          currentX += colWidths[index]
          ctx.beginPath()
          ctx.moveTo(currentX, currentY)
          ctx.lineTo(currentX, currentY + cellHeight)
          ctx.stroke()
        })
      } else {
        const values = [row.author, row.total, row.A, row.B, row.C, row.D, row.E, row.rate]
        values.forEach((value, index) => {
          const x = currentX + colWidths[index]/2
          ctx.fillStyle = (index >= 2 && index <= 6 && value > 0) ? '#ff0000' : '#000000'
          ctx.fillText(value.toString(), x, currentY + (cellHeight/2) + 8)
          currentX += colWidths[index]
          ctx.beginPath()
          ctx.moveTo(currentX, currentY)
          ctx.lineTo(currentX, currentY + cellHeight)
          ctx.stroke()
        })
      }
      currentY += cellHeight
    })
    
    // 绘制总计行
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(25, currentY, tableWidth, cellHeight)
    ctx.strokeRect(25, currentY, tableWidth, cellHeight)
    
    currentX = 25
    if (isPersonTable) {
      const values = ['总计', totalRow.pendingCount, totalRow.solvedCount, totalRow.rate]
      values.forEach((value, index) => {
        const x = currentX + colWidths[index]/2
        ctx.fillStyle = index === 1 && value > 0 ? '#ff0000' : '#000000'
        ctx.fillText(value.toString(), x, currentY + (cellHeight/2) + 8)
        currentX += colWidths[index]
        ctx.beginPath()
        ctx.moveTo(currentX, currentY)
        ctx.lineTo(currentX, currentY + cellHeight)
        ctx.stroke()
      })
    } else {
      const values = ['总计', totalRow.total, totalRow.A, totalRow.B, totalRow.C, totalRow.D, totalRow.E, totalRow.rate]
      values.forEach((value, index) => {
        const x = currentX + colWidths[index]/2
        ctx.fillStyle = (index >= 2 && index <= 6 && value > 0) ? '#ff0000' : '#000000'
        ctx.fillText(value.toString(), x, currentY + (cellHeight/2) + 8)
        currentX += colWidths[index]
        ctx.beginPath()
        ctx.moveTo(currentX, currentY)
        ctx.lineTo(currentX, currentY + cellHeight)
        ctx.stroke()
      })
    }
    
    return currentY + cellHeight
  }
});