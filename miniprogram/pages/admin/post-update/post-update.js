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
    },
    // 新增评论相关数据
    commentContent: '',
    isReassign: false,
    userList: [],
    showUserSearch: false,
    selectedUser: null,
    currentStatus: '',
    // 弹出层相关
    showReassignPopup: false,
    searchTimeout: null, // 搜索延迟定时器
    allUsers: [], // 所有用户列表
    filteredUsers: [] // 过滤后的用户列表
  },
//加载监听
  onLoad(options) {
    // 获取所有用户列表
    this.getAllUsers();
    
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
  const xgzt = this.data.ztlistpost;  // 获取当前选中的状态值
  let data = {
    当前状态: xgzt,
    id: this.data._id  // 帖子ID
  }
  console.log("修改状态按钮检查", data)
  app.$api.setPostStatus(data).then(res => {
    if (res.code) {
      this.setData({
        当前状态: !this.data.ztlistpost
      })
      app.$comm.successToShow("修改成功", () => {})
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

  // 评论输入处理
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 转派开关处理
  toggleReassign(e) {
    const isChecked = e.detail.value;
    this.setData({
      isReassign: isChecked
    });
    
    if (isChecked) {
      this.showUserSearch();
    } else {
      this.setData({
        selectedUser: null
      });
    }
  },

  // 显示用户搜索
  showUserSearch() {
    this.setData({
      showUserSearch: true
    });
  },

  // 隐藏用户搜索
  hideUserSearch() {
    this.setData({
      showUserSearch: false
    });
  },

  // 状态变更
  onStatusChange(e) {
    const index = e.detail.value;
    this.setData({
      currentStatus: this.data.zhuangtaiList[index]
    });
  },

  // 提交评论
  submitComment() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

    // 检查是否选择了状态
    if (!this.data.currentStatus) {
      wx.showToast({
        title: '请您选择问题当前状态',
        icon: 'none'
      });
      return;
    }

    const commentData = {
      parentId: this.data._id,
      content: this.data.commentContent,
      author: app.globalData.userInfo.username,
      author_id: app.globalData.userInfo.OPENID,
      author_belong: app.globalData.userInfo.quxian,
      postStatus: this.data.currentStatus,
      product_img_list: [],
      atUser: '',
      atOpenid: ''
    };

    // 如果是转派，添加@用户信息
    if (this.data.selectedUser) {
      commentData.atUser = `${this.data.selectedUser.username}${this.data.selectedUser.quxian}`;
      commentData.atOpenid = this.data.selectedUser.OPENID;
      console.log('添加@用户信息:', { atUser: commentData.atUser, atOpenid: commentData.atOpenid });
    }

    console.log('提交评论数据:', commentData);

    // 先添加评论
    app.$api.addPostAdmin(commentData).then(res => {
      console.log('评论提交结果:', res);
      if (res.code) {
        // 更新帖子状态
        const statusData = {
          id: this.data._id,
          当前状态: this.data.currentStatus
        };
        console.log('更新帖子状态数据:', statusData);

        // 更新帖子状态
        app.$api.setPostStatus(statusData).then((statusRes) => {
          console.log('状态更新结果:', statusRes);
          wx.showToast({
            title: '回复成功',
            icon: 'success'
          });

          // 刷新评论列表和帖子状态
          const condition = {
            id: this.data._id,
            isLogin: true
          };
          app.$api.getPostDetail(condition).then(res => {
            console.log('刷新帖子详情:', res);
            if (res.code) {
              this.setData({
                commentList: res.data[0].commentList,
                ztlistpost: res.data[0].当前状态,
                commentContent: '',
                isReassign: false,
                selectedUser: null,
                currentStatus: ''
              });
            }
          });
        });
      } else {
        wx.showToast({
          title: '回复失败',
          icon: 'none'
        });
      }
    });
  },

  // 显示转派弹出层
  showReassignPopup() {
    this.setData({
      showReassignPopup: true,
      isReassign: true
    });
    this.searchUsers('');
  },

  // 隐藏转派弹出层
  hideReassignPopup() {
    this.setData({
      showReassignPopup: false
    });
  },

  // 阻止冒泡
  stopPropagation() {
    return;
  },

  // 确认转派
  confirmReassign() {
    if (!this.data.selectedUser) {
      wx.showToast({
        title: '请选择转派对象',
        icon: 'none'
      });
      return;
    }
    this.setData({
      showReassignPopup: false
    });
  },

  // 选择用户
  selectUser(e) {
    const user = e.currentTarget.dataset.user;
    console.log('选择的用户信息:', user);
    
    this.setData({
      selectedUser: user,
      showUserSearch: false,
      showReassignPopup: false
    });

    // 在评论内容开头添加@信息
    const atText = `@${user.username}${user.quxian} `;
    let content = this.data.commentContent || '';
    
    console.log('当前评论内容:', content);
    console.log('要添加的@文本:', atText);
    
    // 检查是否已经有@信息
    if (!content.includes(atText)) {
      content = atText + content;
      this.setData({
        commentContent: content
      });
    }
    
    console.log('更新后的评论内容:', this.data.commentContent);
  },
  getAllUsers() {
    app.$api.getUserlist({
      page: 1,
      limit: 9999
    }).then(res => {
      if (res.code) {
        this.setData({
          allUsers: res.data,
          filteredUsers: res.data
        });
      }
    });
  },
  // 搜索用户
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase().trim();
    const filteredUsers = this.data.allUsers.filter(user => {
      return user.username.toLowerCase().includes(keyword) ||
             user.quxian.toLowerCase().includes(keyword);
    });
    this.setData({
      filteredUsers: filteredUsers
    });
  },
})
