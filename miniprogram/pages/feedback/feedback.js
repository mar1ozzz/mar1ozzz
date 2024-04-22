let app = getApp()
Page({
  data: {
    content_max: 140,
    content: ''
  },
  bindTextarea(e) {
    this.setData({
      content: e.detail.value
    })
  },
  send() {
    let {
      content
    } = this.data
    if (content == '') {
      app.$util.errorToShow("反馈内容不能为空")
      return;
    }
    app.$api.addFeedback({
      content
    }).then(res => {
      if (res.code) {
        app.$comm.successToShow("反馈成功", () => {
          app.$comm.navigateBack()
        })
      }
    })
  }
})