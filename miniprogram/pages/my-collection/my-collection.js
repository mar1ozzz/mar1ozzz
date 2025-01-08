// pages/my-collection/my-collection.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showActionSheet: false,
    actionSheetItems: [{
      text: "我的发现",
      color: "#333"
    }, {
      text: "我的回复",
      color: "#333"
    }, {
      text: "我的关注",
      color: "#333"
    }, {
      text: "返回列表",
      color: "#333"
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  showActionSheet() {
    this.setData({
      showActionSheet: true
    });
  },

  closeActionSheet() {
    this.setData({
      showActionSheet: false
    });
  },

  itemClick(e) {
    const index = e.detail.index;
    this.setData({
      showActionSheet: false
    });
    
    if (index === 0) {
      // 我的发现
      const app = getApp();
      app.$comm.navigateTo('/pages/my/my?searchType=1');
    } else if (index === 1) {
      // 我的回复
      const app = getApp();
      app.$comm.navigateTo('/pages/my/my?searchType=2');
    } else if (index === 2) {
      // 我的关注
      const app = getApp();
      app.$comm.navigateTo('/pages/my/my?searchType=3');
    } else if (index === 3) {
      // 返回列表
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
})