const app = getApp();

Page({
  data: {
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆','重点场景'],
    classifyIndex: 0,
    zhuangtaiList:  ['待回复','规划中','建设中','暂挂中','已解决'], 
    ztlistpost: '',
    product_img_list: [], // 用于存储标题区域的图片
    reply_images: [], // 用于存储回复区域的图片
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
            // 数据库中是WGS84，转换为GCJ02用于地图显示
            let [gcjLng, gcjLat] = app.coordTransform.toGCJ02(postData.经度, postData.纬度);
            
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
              }],
              // 保存原始WGS84坐标用于显示和存储
              wgslatitude: postData.纬度,
              wgslongitude: postData.经度
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
            watched: false,  // 默认未关注，会通过getWatch更新
            username: postData.author || '',
            createTime: postData.product_time || ''
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
    const { latitude, longitude } = e.detail;  // 从地图获取的是GCJ02
    let wgsCoords = app.coordTransform.toWGS84(longitude, latitude);
    
    this.setData({
      // 地图和标记使用GCJ02
      'markers[0].latitude': parseFloat(latitude.toFixed(6)),
      'markers[0].longitude': parseFloat(longitude.toFixed(6)),
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      
      // 界面显示和存储使用WGS84
      wgslatitude: wgsCoords.lat,  // 已经在转换工具中处理过小数位
      wgslongitude: wgsCoords.lng
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

  chooseReplyImageHandle(e) {
    // 在这里处理评论区的图片上传逻辑
    this.setData({
      reply_images: e.detail.imgArr || []
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
    const status = this.data.zhuangtaiList[index];
    const statusText = `#${status} `;
    let content = this.data.commentContent || '';
    
    // 检查是否已经存在状态标签
    if (!content.includes(statusText)) {
      content = content + statusText;  // 改为添加到末尾
      this.setData({
        currentStatus: status,
        commentContent: content
      });
    }
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
      product_img_list: this.data.reply_images, // 提交回复图片
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
  
          // 重新加载帖子详情
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
                reply_images: [], // 清空回复图片
                isReassign: false,
                selectedUser: null,
                currentStatus: ''
              }, () => {
                // 强制刷新页面
                this.setData({
                  forceUpdate: Math.random() // 强制更新页面
                });
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
  },

  // 复制经纬度的函数
  copyLL: function() {
    const { wgslongitude, wgslatitude } = this.data;
    wx.setClipboardData({
      data: `${wgslongitude}, ${wgslatitude}`,
      success: function() {
        wx.showToast({
          title: '经纬度已复制!',
          icon: 'success'
        });
      }
    });
  },
});