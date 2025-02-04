let app = getApp()
Page({
  data: {   
    product_img_list: [],
    parentId: '',
    isReassign: false, // 是否转派
    userList: [], // 用户列表
    selectedUser: null, // 选中的用户
    postStatus: '待回复', // 帖子状态
    statusList: ['待回复', '建设中', '规划中', '已解决'], // 状态列表
    showUserSearch: false, // 是否显示用户搜索
    showReassignPopup: false, // 是否显示转派弹窗
    allUsers: [], // 所有用户列表
    filteredUsers: [] // 过滤后的用户列表
  },

  onLoad(options) {
    this.setData({
      parentId: options.id
    })
    // 获取帖子当前状态
    if (options.id) {
      app.$api.getPostDetail({ id: options.id }).then(res => {
        if (res.code) {
          this.setData({
            postStatus: res.data.currentStatus || '待回复'
          })
        }
      })
    }
    // 获取所有用户列表
    this.getAllUsers()
  },

  // 获取所有用户
  getAllUsers() {
    app.$api.getUserlist({
      page: 1,
      limit: 9999
    }).then(res => {
      if (res.code) {
        this.setData({
          allUsers: res.data,
          filteredUsers: res.data
        })
      }
    })
  },

  // 切换转派状态
  toggleReassign(e) {
    const isReassign = e.detail.value
    this.setData({
      isReassign,
      showReassignPopup: isReassign,
      selectedUser: null
    })
    if (isReassign) {
      this.setData({
        showUserSearch: true
      })
    }
  },

  // 显示转派弹窗
  showReassignPopup() {
    this.setData({
      showReassignPopup: true,
      isReassign: true
    })
    this.setData({
      showUserSearch: true
    })
  },

  // 隐藏转派弹窗
  hideReassignPopup() {
    this.setData({
      showReassignPopup: false
    })
  },

  // 确认转派
  confirmReassign() {
    if (!this.data.selectedUser) {
      wx.showToast({
        title: '请选择转派对象',
        icon: 'none'
      })
      return
    }
    this.setData({
      showReassignPopup: false
    })
  },

  // 搜索用户
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase().trim()
    const filteredUsers = this.data.allUsers.filter(user => {
      return user.username.toLowerCase().includes(keyword) ||
             user.quxian.toLowerCase().includes(keyword)
    })
    this.setData({
      filteredUsers: filteredUsers
    })
  },

  // 选择用户
  selectUser(e) {
    const user = e.currentTarget.dataset.user
    this.setData({
      selectedUser: user,
      isReassign: true,
      showReassignPopup: false
    })
  },

  // 阻止冒泡
  stopPropagation() {
    return
  },

  // 选择状态
  bindStatusChange(e) {
    const status = this.data.statusList[e.detail.value]
    this.setData({
      postStatus: status
    })
  },

  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    })
  },

  formSubmit(e) {
    let that = this
    let option = e.detail.value
    option.product_img_list = this.data.product_img_list
   
    let valLoginRes = app.$validate.validate(option, [{
      name: 'content',
      type: 'required',
      errmsg: '详情不能为空'
    }])
    if (!valLoginRes.isOk) {
      app.$comm.errorToShow(valLoginRes.errmsg)
      return false
    }

    // 添加状态和转派信息
    Object.assign(option, {
      parentId: that.data.parentId,
      author: app.globalData.userInfo.username,
      author_id: app.globalData.userInfo.OPENDID,
      author_belong: app.globalData.userInfo.quxian,
      postStatus: that.data.postStatus
    })

    // 先添加评论
    app.$api.addPostAdmin(option).then(res => {
      if (res.code) {
        // 更新帖子状态和待办信息
        let updateData = {
          id: that.data.parentId,
          currentStatus: that.data.postStatus
        }
        
        // 如果状态不是已解决，更新待办人
        if (that.data.postStatus !== '已解决') {
          updateData.lastRespondent = that.data.selectedUser ? 
            that.data.selectedUser._id : 
            app.globalData.userInfo.OPENDID
        }

        app.$api.updatePost(updateData).then(() => {
          app.$comm.successToShow("提交成功", () => {
            app.$comm.navigateBack()
          })
        })
      }
    })
  },

  pageBack() {
    app.$comm.navigateBack()
  }
})