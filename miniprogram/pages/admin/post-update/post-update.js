let app = getApp()
//gcj02经纬度修正为wgs84
function gcj02towgs84(lng, lat) {
  var a = 6378245.0;
  var ee = 0.00669342162296594323;
  var pi = Math.PI;
  function out_of_china(lng, lat) {
      if (lng < 72.004 || lng > 137.8347)
          return true;
      if (lat < 0.8293 || lat > 55.8271)
          return true;
      return false;
  }
  function transformlat(lng, lat) {
      var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lat * pi) + 40.0 * Math.sin(lat / 3.0 * pi)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(lat / 12.0 * pi) + 320 * Math.sin(lat * pi / 30.0)) * 2.0 / 3.0;
      return ret;
  }
  function transformlng(lng, lat) {
      var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lng * pi) + 40.0 * Math.sin(lng / 3.0 * pi)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(lng / 12.0 * pi) + 300.0 * Math.sin(lng / 30.0 * pi)) * 2.0 / 3.0;
      return ret;
  }
  function delta(lng, lat) {
      var dlng = transformlng(lng - 105.0, lat - 35.0);
      var dlat = transformlat(lng - 105.0, lat - 35.0);
      var radlat = lat / 180.0 * pi;
      var magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      var sqrtmagic = Math.sqrt(magic);
      dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * pi);
      dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi);
      return { 'lng': dlng, 'lat': dlat };
  }
  var d = delta(lng, lat);
  var result = {
      'lng': lng - d.lng,
      'lat': lat - d.lat
  };
  return result;
}
Page({
  data: {
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆'],
    classifyIndex: 0,
    zhuangtaiList:  ['待回复','规划中','建设中','暂挂中','已解决'], 
    zhuangtaiIndex:['0','1','2','3','4'],
    ztlistpost: '',
    product_img_list: [],
    pageType: 'add',
    _id: "",
    watched:false,
    commentList:[],
    latitude: "",
    longitude: "",
    markers:[{
      id: 0,
      latitude : "",
      longitude : "",
      width: 20,
      height: 30,
  }],
    wgslatitude:"",
    wgslongitude:"",
    mapCtx: null,

    initData: {
      title: "",
      type: "",
      content: "",     
      product_img_list: [],
    }
  },
//加载监听
  onLoad(options) {
    let {
      id,
      info,
      title,
      type ,
      content,
      pageType,
      当前状态
    } = options
    let condition={
      id:id,
      isLogin:true}

    if (~['update', 'show'].indexOf(pageType)) {
       app.$api.getPostDetail(condition).then(res => {
         console.log("获取发帖内容",res)
         const ztlistpost = res.data[0].当前状态;
         console.log('当前状态', ztlistpost);
         if(res.code){
           this.setData({
            product_img_list:res.data[0].product_img_list,
            commentList:res.data[0].commentList,
            classifyIndex:this.data.classifyList.indexOf(res.data[0].type),
            ztlistpost:ztlistpost,
           })
         }
         console.log("获取内容校验",this.data) 
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
        pageType: pageType,
        ztlistpost:当前状态
      })
    }
    this.getWatch()
    this.data.mapCtx = wx.createMapContext('map')
    /*获取客户经纬度自动更新
    wx.getLocation({
      type:"gcj02",
      success: res => {
        console.log('getLocation结果',res)
        const latitude = res.latitude;
        const longitude = res.longitude;
        let wgsCoords = gcj02towgs84(longitude, latitude);
        this.setData({
          latitude,
          longitude,
          wgslatitude: wgsCoords.lat.toFixed(6), // WGS84格式纬度
          wgslongitude: wgsCoords.lng.toFixed(6), // WGS84格式经度
          markers: [{
            id: 0,
            latitude,
            longitude,
            iconPath: '', // 根据需要设置图标路径
            width: 20,
            height: 30,
          }]
        });
      console.log('markers结果',this.data.markers)
    }
    });*/
  },

// 在onMapTap事件中更新标记位置并移动地图
onMapTap: function(e) {
    // 获取点击位置的经纬度
    const { latitude, longitude } = e.detail;
    let wgsCoords = gcj02towgs84(longitude, latitude);
    // 更新标记位置
    this.setData({
        'markers[0].latitude': latitude,
        'markers[0].longitude': longitude,
        // 使用 WGS84 格式的经纬度更新 wgslatitude 和 wgslongitude
        wgslatitude: wgsCoords.lat.toFixed(6), // 保留小数点后六位
        wgslongitude: wgsCoords.lng.toFixed(6) // 保留小数点后六位
    });
  },
//加载分类管理数据并更新页面上的分类列表
  loadClassifyAdmin() {
    app.$api.getClassifyAdmin().then(res => {
      if (res.code) {
        this.setData({
          classifyList: res.data
        })
      }
    })
  },
//根据用户选择的值更新页面上对应的分类索引。
  classifyPickerChange(e) {
    console.log("分类选择显示",e)
    this.setData({
      classifyIndex: e.detail.value
    })
  },
  //修改状态
  zhuangtaiPickerChange: function (e) {
    const xgzt = e.detail.value; // 获取 picker 改变后的索引
    const newValue = this.data.zhuangtaiList[xgzt]; // 获取新值
    this.setData({
      ztlistpost: newValue // 更新 input 的值
    });
  },

// 修改状态按钮
  xiugaizhuangtai: function (e) {
    const xgzt = this.data.ztlistpost;
    let data = xgzt;
    console.log("修改状态按钮检查",data)
    app.$api.addxgzt(data).then(res=>{
      if (res.code) {
        that.setData({
          当前状态:!this.data.ztlistpost
        })
        app.$comm.successToShow("修改成功", () => {
        })
    }
  })
},

  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    })
  },

  formSubmit(e) {
    let {
      pageType,
      product_img_list
    } = this.data
    let option = e.detail.value
    option.product_img_list = product_img_list
   
    if (pageType == 'update') {

    }
    
    let valLoginRes = app.$validate.validate(option, [{
      name: 'title',
      type: 'required',
      errmsg: '标题不能为空'
    }, {
      name: 'type',
      type: 'required',
      errmsg: '类别不能为空'
    }, {
      name: 'content',
      type: 'required',
      errmsg: '详情不能为空'
    }])
    if (!valLoginRes.isOk) {
      app.$comm.errorToShow(valLoginRes.errmsg)
      return false
    }

    if (pageType == 'add') {
      Object.assign(option, {
        author: app.globalData.userInfo.username,
        author_id:app.globalData.userInfo.OPENDID,
        author_belong:app.globalData.userInfo.quxian,
        经度:parseFloat(this.data.wgslongitude),
        纬度:parseFloat(this.data.wgslatitude),
        当前状态:"待回复"
      })
      this.addPost(option)
    } else if (pageType == 'update') {
      this.updatePost(Object.assign(option, {
        _id: this.data.initData._id
      }))
    }
  },
  addPost(data) {
    console.log("addPost",data)
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
comment(){
  app.$comm.navigateTo('/pages/comment/comment?id='+this.data._id)
},
watch(){
  let that=this
  let data={
    id:this.data._id,
    watched:this.data.watched,
    username:app.globalData.userInfo.username
  }
  app.$api.addWatch(data).then(res=>{
    if (res.code) {
      that.setData({
        watched:!this.data.watched
      })
      app.$comm.successToShow("修改成功", () => {
       //app.$comm.navigateBack()
      })
  }
})
},

getWatch(){
  console.log('ygm watch')
  let that=this
  let data={
    id:this.data._id, 
    username: app.globalData.userInfo.username 
  }
  app.$api.getWatch(data).then(res=>{
    console.log('watch log',res)
    if (res.code) {             
        that.setData({
          watched:true
        })
       //app.$comm.navigateBack()
      }
  }
)
},

ViewImage(e) {
  wx.previewImage({
    urls: this.data.product_img_list,
    current: e.currentTarget.dataset.url
  })
},

})
