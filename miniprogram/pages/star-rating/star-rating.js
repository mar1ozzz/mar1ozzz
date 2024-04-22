// pages/index/index.js
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    margin: 20,
    scoreComment: '',
    score: 10,
    product_img_list: [],
    id: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      id: options.id
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  score: function (e) {
    // 这里可以获取当前分数
    this.setData({
      score: e.detail.score
    })
  },
  confirm() {
    let data = {
      id: this.data.id,
      author: app.globalData.userInfo.username,
      author_belong: app.globalData.userInfo.quxian,
      score: this.data.score,
      scoreComment: this.data.scoreComment,
      product_img_list: this.data.product_img_list
    }
    if (this.data.scoreComment == '') {
      app.$comm.errorToShow("评价内容不能为空")
      return;
    }
    app.$api.setPostScore(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("评分成功", () => {
          //app.$comm.navigateBack()
        })
      }
    })
    return wx.switchTab({
      url: '/pages/user/user'
    })
  },
  bindTextarea(e) {
    this.setData({
      scoreComment: e.detail.value
    })
  },
  cancel() {
    return wx.switchTab({
      url: '/pages/user/user'
    })
  },

  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    })
  },

})