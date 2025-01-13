const app = getApp()

Page({
  data: {
    todoList: [],
    page: 1,
    limit: 20,
    loading: false,
    loadEnd: false,
    logs: [] // 用于记录操作日志
  },

  onLoad() {
    this.loadTodoList()
  },

  onShow() {
    this.setData({
      page: 1,
      loadEnd: false,
      todoList: []
    })
    this.loadTodoList()
  },

  // 加载待办列表
  async loadTodoList() {
    if (this.data.loading || this.data.loadEnd) return
    
    try {
      this.setData({ loading: true })
      console.log('开始加载待办列表')

      const userInfo = app.globalData.userInfo;
      if (!userInfo) {
        console.log('未找到用户信息')
        return
      }

      const userTag = `@${userInfo.username}${userInfo.quxian}`;
      console.log('查找评论包含:', userTag)

      const db = wx.cloud.database()
      const _ = db.command
      
      // 查找所有帖子
      const posts = await db.collection('post')
        .where({
          commentList: _.elemMatch({
            content: db.RegExp({
              regexp: userTag,
              options: 'i',
            })
          }),
          当前状态: _.neq('已解决')
        })
        .skip((this.data.page - 1) * this.data.limit)
        .limit(this.data.limit)
        .orderBy('updateTime', 'desc')
        .get()

      console.log('找到@我的未解决帖子:', posts.data.length)

      if (posts.data.length === 0) {
        this.setData({
          loading: false,
          loadEnd: true
        });
        return;
      }

      // 为每个帖子找到最新的@我的评论
      const todoItems = posts.data.map(post => {
        const latestComment = post.commentList
          .filter(comment => comment.content.includes(userTag))
          .sort((a, b) => {
            // 将日期格式转换为 iOS 支持的格式
            const dateA = a.product_time.replace(/\s/, 'T');
            const dateB = b.product_time.replace(/\s/, 'T');
            return new Date(dateB) - new Date(dateA);
          })[0];

        return {
          ...post,
          todoType: '@待办',
          latestComment
        };
      });

      this.setData({
        todoList: [...this.data.todoList, ...todoItems],
        page: this.data.page + 1,
        loadEnd: todoItems.length < this.data.limit,
        loading: false
      });

      console.log('加载待办项完成:', todoItems.length)

    } catch (error) {
      console.error('加载待办列表错误:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 记录操作日志
  logOperation(message) {
    const logs = [...this.data.logs, `${new Date().toLocaleString()}: ${message}`]
    this.setData({ logs })
    console.log(message)
  },

  // 点击待办项
  itemClick(e) {
    const item = e.currentTarget.dataset.item;
    app.$comm.navigateTo(`/pages/admin/post-update/post-update?pageType=show&id=${item._id}&title=${item.title}&type=${item.type}&content=${item.content}&author=${item.author}`);
  },

  onReachBottom() {
    this.loadTodoList()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      loadEnd: false,
      todoList: []
    })
    this.loadTodoList().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
