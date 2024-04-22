let app = getApp()
Page({
  data: {
    classifyList: ['优化','光缆','传输','资管','综维'],
    classifyIndex: 0,
    product_img_list: [],
    pageType: 'add',
    _id: "",
    watched:false,
    commentList:[],
    score:0,

    initData: {
      title: "",
      type: "",
      content: "",     
      product_img_list: [],      
      
    }
  },
  onLoad(options) {
    
    let {
      id,
      info,
      title,
      type ,
      content,
      pageType
    } = options
    let condition={
      id:id,
      isLogin:true}  
    if (~['update', 'show'].indexOf(pageType)) {
       app.$api.getPostDetail(condition).then(res => {
         console.log(res)
         if(res.code){
           this.setData({
             score:res.data[0].score,
            product_img_list:res.data[0].product_img_list,
            commentList:res.data[0].commentList
           })
         }        
        
      }) 
      

      let { 
        initData
      } = this.data     
      this.setData({ 
        _id:id, 
        info:info,
        title:title,
        type:type ,
        content:content,     
        pageType: pageType
      })
    }
    //this.getWatch()
   // this.loadClassifyAdmin()
  },  
 
  formSubmit(e) {
    app.$comm.navigateTo(`/pages/star-rating/star-rating?id=${this.data._id}`)
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


ViewImage(e) {
  wx.previewImage({
    urls: this.data.product_img_list,
    current: e.currentTarget.dataset.url
  })
},
})