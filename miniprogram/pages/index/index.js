let app = getApp()
Page({
  data: {
    searchKey: "aaa",
    width: 200,
    height: 64,
    inputTop: 0,
    arrowTop: 0,
    dropScreenH: 0,
    timed:true,
    commented:true,
    watched:true,

    tabIndex: 0,
    isList: false,
    selectedName: "排序",
    selectH: 0,
    dropdownList: [ {
      name: "时间升序",
      selected: false
    }, {
      name: "时间降序",
      selected: false
    }],
    productList: [],
    option: {
      page: 1,
      limit: 6,
      loadend: false,
      loading: false
    }
  },
  onLoad: function (option) {
    let obj = wx.getMenuButtonBoundingClientRect();
    this.setData({
      searchKey: option.searchKey || "",
      product_type_name: option.product_type_name || ''
    }, () => {
      wx.getSystemInfo({
        success: (res) => {
          console.log('sysinfo',res)
          this.setData({
            height: res.statusBarHeight + obj.height + (obj.top - res.statusBarHeight) * 2,
            inputTop: obj.top + 1,
            arrowTop: obj.top,
            width: obj.left,
            dropScreenH: this.data.height * 750 / res.windowWidth - 120,
          })
        }
      })
    });
   // this.loadLikeProductList()
  },
  onShow(){
   this.setData({
    'option.page': 1,
     productList: []
   })
    this.loadLikeProductList()
  },
  screen: function (e) {
    let index = e.currentTarget.dataset.index; 
    if(index==0) { 
        this.setData({
          tabIndex: index,
          timed:!this.data.timed,
        })
      }

      if(index==1) { 
        this.setData({
          tabIndex: index,
          commented:!this.data.commented,
        })
      }

      if(index==2) { 
        this.setData({
          tabIndex: index,
          watched:!this.data.watched,
        })
      }
        this.inintload()
    
  },
  back: function () {
    wx.navigateBack()
  },
  showDropdownList: function () {
    this.setData({
      selectH: 246
    })
  },
  hideDropdownList: function () {
    this.setData({
      selectH: 0
    })
  },
  dropdownItem: function (e) {
    let index = e.currentTarget.dataset.index;
    let arr = this.data.dropdownList;
    let tabIndex = this.data.tabIndex
    if (tabIndex == 0 && arr[index].selected) {
      this.hideDropdownList()
      return
    }
    for (let i = 0; i < arr.length; i++) {
      if (i === index) {
        arr[i].selected = true;
      } else {
        arr[i].selected = false;
      }
    }
  /*   this.setData({
      tabIndex: 0,
      dropdownList: arr,
      selectedName: index == 0 ? '综合' : '时间'
    }) */
    this.hideDropdownList()
    this.inintload()
  },
  inintload() {
    this.setData({
      productList: [],
      option: {
        page: 1,
        limit: 6,
        loadend: false,
        loading: false
      }
    })
    this.loadLikeProductList()
  },
  loadLikeProductList() {
    
    let {
      page,
      limit,
      loadend
    } = this.data.option    
   
    this.setData({
      "option.loading": true
    })
    let {
      tabIndex,
      searchKey,
      product_type_name
    } = this.data
    
    let option = {
      page: page,
      limit: limit,
      searchKey: searchKey || ''
    }
   
    let condition = {
      postTime:'desc',
      comment:'desc',
      watch:'desc' ,
      index:this.data.tabIndex,
      date:new Date()   
    }
    if(this.data.timed){
      condition. postTime='asc'
    }
    if(this.data.watched){
      condition. watch='asc'
    }
    if(this.data.commented){
      condition. comment='asc'
    }
    this.setData({
      "option.loading": true
    })
    console.log('index onshow')
    app.$api.getPostList(Object.assign(option, condition)).then(res => {
      let {
        productList
      } = this.data
      if (res.code) {
        let proList = res.data
        if (productList.length > 0) {
          this.setData({
            productList: productList.concat(proList)
          })
        } else {
          this.setData({
            productList: proList
          })
        }

        if (proList.length < limit) {
          this.setData({
            "option.loadend": true
          })
        }

        this.setData({
          "option.page": ++page,
          "option.loading": false
        })
      }
    })

  },
  onReachBottom() {
    this.loadLikeProductList()
  },
  toSeachHandle() {
    //app.$comm.navigateBack()
    console.log('ygm search')
  },
  addPost(){
    app.$comm.navigateTo('/pages/admin/post-update/post-update')
  },
  detail(e){
    console.log('index-detail',e)
    let post=e.detail.post
    app.$comm.navigateTo("/pages/admin/post-update/post-update?pageType=show&id=" + post._id+"&title="+post.title+"&type="+post.type+"&content="+post.content+"&author="+post.author)
  }

})