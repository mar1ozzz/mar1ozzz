let app = getApp()

// WGS84转GCJ02
function wgs84togcj02(wgsLng, wgsLat) {
  const PI = 3.14159265358979324;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function out_of_china(lng, lat) {
    if (lng < 72.004 || lng > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
  }

  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  }

  if (out_of_china(wgsLng, wgsLat)) {
    return [wgsLng, wgsLat];
  }

  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
  let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
  let radLat = wgsLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  let gcjLat = wgsLat + dLat;
  let gcjLng = wgsLng + dLng;
  return [gcjLng, gcjLat];
}

// GCJ02转WGS84
function gcj02towgs84(gcjLng, gcjLat) {
  const PI = 3.14159265358979324;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function out_of_china(lng, lat) {
    if (lng < 72.004 || lng > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
  }

  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  }

  if (out_of_china(gcjLng, gcjLat)) {
    return {
      lat: gcjLat,
      lng: gcjLng
    };
  }

  let dLat = transformLat(gcjLng - 105.0, gcjLat - 35.0);
  let dLng = transformLng(gcjLng - 105.0, gcjLat - 35.0);
  let radLat = gcjLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  
  return {
    lat: gcjLat - dLat,
    lng: gcjLng - dLng
  };
}

Page({
  data: {
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆'],
    classifyIndex: 0,
    zhuangtaiList:  ['待回复','规划中','建设中','暂挂中','已解决'], 
    ztlistpost: '',
    product_img_list: [],
    pageType: '', 
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
    searchTimeout: null,
    allUsers: [],
    filteredUsers: []
  },

  onLoad(options) {
    console.log('onLoad options:', options);
    this.getAllUsers();
    
    // 确保pageType正确设置
    const pageType = options.pageType || 'show';
    this.setData({ pageType });

    // 如果是新增模式，设置默认地图中心点
    if (pageType === 'add') {
      this.setData({
        latitude: 31.496911,
        longitude: 104.735986
      });
      return;
    }

    // 如果是查看或编辑模式，获取帖子详情
    if (options.id) {
      const condition = {
        id: options.id,
        isLogin: true
      };

      app.$api.getPostDetail(condition).then(res => {
        console.log("获取发帖内容", res);
        if (res.code && res.data && res.data.length > 0) {
          const postData = res.data[0];
          
          // 检查经纬度信息并设置地图
          if (postData.经度 && postData.纬度) {
            // 将WGS84转换为GCJ02坐标
            let [gcjLng, gcjLat] = wgs84togcj02(postData.经度, postData.纬度);
            
            // 根据状态设置不同的图标
            let iconPath;
            switch (postData.当前状态) {
              case '建设中': iconPath = "../../../static/icon/建设中.png"; break;
              case '规划中': iconPath = "../../../static/icon/规划中.png"; break;
              case '暂挂中': iconPath = "../../../static/icon/暂挂中.png"; break;
              case '待回复': iconPath = "../../../static/icon/待回复.png"; break;
              case '已解决': iconPath = "../../../static/icon/已解决.png"; break;
              default: iconPath = "../../../static/icon/待回复.png";
            }

            this.setData({
              latitude: gcjLat,
              longitude: gcjLng,
              markers: [{
                id: postData._id,
                latitude: gcjLat,
                longitude: gcjLng,
                iconPath: iconPath,
                width: 30,
                height: 30,
                callout: {
                  content: postData.title || '位置标记',
                  padding: 10,
                  borderRadius: 5,
                  display: 'ALWAYS'
                }
              }]
            });
          }
          
          // 更新页面数据
          this.setData({
            _id: options.id,
            title: postData.title,
            type: postData.type,
            content: postData.content,
            product_img_list: postData.product_img_list || [],
            commentList: postData.commentList || [],
            classifyIndex: this.data.classifyList.indexOf(postData.type),
            ztlistpost: postData.当前状态,
            watched: false  // 默认未关注，会通过getWatch更新
          });

          // 初始化地图上下文
          this.data.mapCtx = wx.createMapContext('postMap');
          
          // 获取关注状态
          this.getWatch();
        }
      }).catch(err => {
        console.error('获取帖子详情失败:', err);
        wx.showToast({
          title: '获取帖子详情失败',
          icon: 'none'
        });
      });
    }
  },

  // 在onMapTap事件中更新标记位置并移动地图
  onMapTap(e) {
    const { latitude, longitude } = e.detail;
    let wgsCoords = gcj02towgs84(longitude, latitude);
    this.setData({
      'markers[0].latitude': latitude,
      'markers[0].longitude': longitude,
      wgslatitude: wgsCoords.lat.toFixed(6),
      wgslongitude: wgsCoords.lng.toFixed(6)
    });
  },

  loadClassifyAdmin() {
    app.$api.getClassifyAdmin().then(res => {
      if (res.code) {
        this.setData({
          classifyList: res.data
        });
      }
    });
  },

  classifyPickerChange(e) {
    this.setData({
      classifyIndex: e.detail.value
    });
  },

  zhuangtaiPickerChange(e) {
    const xgzt = e.detail.value;
    const newValue = this.data.zhuangtaiList[xgzt];
    this.setData({
      ztlistpost: newValue
    });
  },

  xiugaizhuangtai(e) {
    const xgzt = this.data.ztlistpost;
    let data = {
      当前状态: xgzt,
      id: this.data._id
    };
    app.$api.setPostStatus(data).then(res => {
      if (res.code) {
        this.setData({
          当前状态: !this.data.ztlistpost
        });
        app.$comm.successToShow("修改成功");
      }
    });
  },

  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    });
  },

  formSubmit(e) {
    let {pageType, product_img_list} = this.data;
    let option = e.detail.value;
    option.product_img_list = product_img_list;
    
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
    }]);

    if (!valLoginRes.isOk) {
      app.$comm.errorToShow(valLoginRes.errmsg);
      return false;
    }

    if (pageType == 'add') {
      Object.assign(option, {
        author: app.globalData.userInfo.username,
        author_id: app.globalData.userInfo.OPENDID,
        author_belong: app.globalData.userInfo.quxian,
        经度: parseFloat(this.data.wgslongitude),
        纬度: parseFloat(this.data.wgslatitude),
        当前状态: "待回复"
      });
      this.addPost(option);
    } else if (pageType == 'update') {
      this.updatePost(Object.assign(option, {
        _id: this.data.initData._id
      }));
    }
  },

  addPost(data) {
    app.$api.addPostAdmin(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("添加成功", () => {
          app.$comm.navigateBack();
        });
      }
    });
  },

  updatePost(data) {
    app.$api.updateProductAdmin(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("修改成功", () => {
          app.$comm.navigateBack();
        });
      }
    });
  },

  pageBack() {
    app.$comm.navigateBack();
  },

  comment() {
    app.$comm.navigateTo('/pages/comment/comment?id=' + this.data._id);
  },

  watch() {
    let data = {
      id: this.data._id,
      watched: this.data.watched,
      username: app.globalData.userInfo.username
    };
    app.$api.addWatch(data).then(res => {
      if (res.code) {
        this.setData({
          watched: !this.data.watched
        });
        app.$comm.successToShow("修改成功");
      }
    });
  },

  getWatch() {
    let data = {
      id: this.data._id,
      username: app.globalData.userInfo.username
    };
    app.$api.getWatch(data).then(res => {
      if (res.code) {
        this.setData({
          watched: true
        });
      }
    });
  },

  ViewImage(e) {
    wx.previewImage({
      urls: this.data.product_img_list,
      current: e.currentTarget.dataset.url
    });
  },

  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

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

  showUserSearch() {
    this.setData({
      showUserSearch: true
    });
  },

  hideUserSearch() {
    this.setData({
      showUserSearch: false
    });
  },

  onStatusChange(e) {
    const index = e.detail.value;
    this.setData({
      currentStatus: this.data.zhuangtaiList[index]
    });
  },

  submitComment() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

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

    if (this.data.selectedUser) {
      commentData.atUser = `${this.data.selectedUser.username}${this.data.selectedUser.quxian}`;
      commentData.atOpenid = this.data.selectedUser.OPENID;
    }

    app.$api.addPostAdmin(commentData).then(res => {
      if (res.code) {
        const statusData = {
          id: this.data._id,
          当前状态: this.data.currentStatus
        };

        app.$api.setPostStatus(statusData).then(() => {
          wx.showToast({
            title: '回复成功',
            icon: 'success'
          });

          const condition = {
            id: this.data._id,
            isLogin: true
          };
          app.$api.getPostDetail(condition).then(res => {
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

  showReassignPopup() {
    this.setData({
      showReassignPopup: true,
      isReassign: true
    });
    this.searchUsers('');
  },

  hideReassignPopup() {
    this.setData({
      showReassignPopup: false
    });
  },

  stopPropagation() {
    return;
  },

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

  selectUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      selectedUser: user,
      showUserSearch: false,
      showReassignPopup: false
    });

    const atText = `@${user.username}${user.quxian} `;
    let content = this.data.commentContent || '';
    
    if (!content.includes(atText)) {
      content = atText + content;
      this.setData({
        commentContent: content
      });
    }
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

  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase().trim();
    const filteredUsers = this.data.allUsers.filter(user => {
      return user.username.toLowerCase().includes(keyword) ||
             user.quxian.toLowerCase().includes(keyword);
    });
    this.setData({
      filteredUsers: filteredUsers
    });
  }
});
