let app = getApp()
Page({
  data: {   
    product_img_list: [],
    parentId:''
   
  },
  onLoad(options) {
   
    this.setData({
      parentId:options.id
    })
    
  },
  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    })
  },
  formSubmit(e) {
    let that=this
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

   
      Object.assign(option, {
        parentId:that.data.parentId,
        author: app.globalData.userInfo.username,
        author_id:app.globalData.userInfo.OPENDID,
        author_belong:app.globalData.userInfo.quxian})
      this.addPost(option)
     
  },
  addPost(data) {
    app.$api.addPostAdmin(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("添加成功", () => {
          app.$comm.navigateBack()
        })
      }
    })
  },
  updatePost(data) {
    app.$api.updateProductAdmin(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("修改成功", () => {
          app.$comm.navigateBack()
        })
      }
    })
  },
  pageBack(){
    app.$comm.navigateBack()
  },
  
})