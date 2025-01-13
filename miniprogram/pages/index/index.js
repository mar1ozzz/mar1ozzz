let app = getApp()
Page({
  data: {
    searchKey: "",
    width: 200,
    height: 64,
    inputTop: 0,
    arrowTop: 0,
    dropScreenH: 0,
    timed: false,  // 默认为 false，表示降序
    tabIndex: 0,
    currentStatus: 0,
    productList: [],
    option: {
      page: 1,
      limit: 2000,
      loadend: false,
      loading: false
    },
    cacheTimeout: 5 * 60 * 1000,
    isRefreshing: false,
    currentTab: 'post',  // 默认选中“我的发帖”
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
      text: "我的待办",
      color: "#333"
    }]
  },

  onLoad: function (option) {
    let obj = wx.getMenuButtonBoundingClientRect();
    this.setData({
      searchKey: option.searchKey || "",
      product_type_name: option.product_type_name || ''
    }, () => {
      wx.getSystemInfo({
        success: (res) => {
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
  },

  onShow() {
    // 每次显示页面时，都强制刷新数据
    this.setData({
      'option.page': 1,
      'option.loadend': false,
      productList: []
    })
    this.loadLikeProductList(true) // 强制刷新
  },

  onHide() {
    // 页面隐藏时清除缓存
    wx.removeStorage({
      key: 'productListCache'
    })
  },

  onUnload() {
    // 页面卸载时清除缓存
    wx.removeStorage({
      key: 'productListCache'
    })
  },

  handleStatusChange(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    this.setData({
      currentStatus: status,
      'option.page': 1,
      'option.loadend': false,
      productList: []
    });
    this.loadLikeProductList(true); // 强制刷新
  },

  screen(e) {
    let index = parseInt(e.currentTarget.dataset.index)
    if (index >= 3) { 
      this.setData({
        currentStatus: index - 3,
        'option.page': 1,
        'option.loadend': false,
        productList: []
      }, () => {
        this.loadLikeProductList(true) // 强制刷新
      })
      return 
    }
    
    if (index == 0) {
      this.setData({
        tabIndex: index,
        timed: !this.data.timed,
        'option.page': 1,
        'option.loadend': false,
        productList: []
      }, () => {
        this.loadLikeProductList(true) // 强制刷新
      })
    }
  },

  loadLikeProductList(forceRefresh = false) {
    let {
      page,
      limit,
      loadend
    } = this.data.option    
   
    if (loadend) return Promise.resolve();
    
    if (page === 1 && !forceRefresh) {
      const cachedData = this.checkCache();
      if (cachedData) {
        this.setData({
          productList: cachedData,
          'option.loadend': true,
          'option.loading': false
        });
        return Promise.resolve();
      }
    }
    
    let {
      searchKey,
      product_type_name
    } = this.data
    
    wx.showLoading({
      title: forceRefresh ? '刷新中...' : '加载中...',
      mask: true
    })
    
    let status = '';
    if (this.data.currentStatus === 1) {
      status = '待处理';
    } else if (this.data.currentStatus === 2) {
      status = '已处理';
    }
    
    let option = {
      page: page,
      limit: limit,
      searchKey: searchKey || '',
      status: status,
      index: this.data.tabIndex,
      postTime: this.data.timed ? 'asc' : 'desc',
      comment: 'desc',
      watch: 'desc'
    }

    // 如果不是管理员，只显示自己的帖子
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo.isAdmin) {
      option.author = userInfo.username;
      console.log('首页 - 普通用户查询，用户名：', userInfo.username);
    } else {
      console.log('首页 - 管理员用户查询');
    }
    
    console.log('首页 - 查询条件：', option);
   
    let condition = {
      date: new Date()   
    }

    this.setData({
      "option.loading": true
    })

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'));
      }, 30000);
    });

    return Promise.race([
      app.$api[userInfo.isAdmin ? 'getPostList' : 'getMyPostList'](Object.assign(option, condition)),
      timeoutPromise
    ]).then(res => {
      wx.hideLoading()
      if (res.code) {
        let proList = res.data || [];
        
        if (this.data.currentStatus !== 0) {
          const pendingStatus = new Set(['待回复', '规划中', '暂挂中', '建设中', '待处理']);
          const completedStatus = new Set(['已解决']);
          
          proList = proList.filter(item => {
            let itemStatus = item.status || item.当前状态 || '待处理';
            
            if (this.data.currentStatus === 1) {
              return pendingStatus.has(itemStatus);
            } else {
              return completedStatus.has(itemStatus);
            }
          });
        }

        const newList = this.data.productList.length > 0 
          ? this.data.productList.concat(proList)
          : proList;

        const batchSize = 1000;
        const updateData = () => {
          const currentLength = this.data.productList.length;
          const nextBatch = newList.slice(currentLength, currentLength + batchSize);
          
          if (nextBatch.length > 0) {
            this.setData({
              productList: this.data.productList.concat(nextBatch)
            }, () => {
              setTimeout(() => updateData(), 100);
            });
          } else {
            if (proList.length < limit) {
              if (page === 1) {  // 移除 !forceRefresh 条件，总是更新缓存
                this.updateCache(newList);
              }
              this.setData({
                "option.loadend": true,
                "option.loading": false
              })
            } else {
              this.setData({
                "option.page": ++page,
                "option.loading": false
              }, () => {
                if (proList.length === limit) {
                  this.loadLikeProductList(forceRefresh)
                }
              })
            }
          }
        };
        
        updateData();
      } else {
        wx.showToast({
          title: forceRefresh ? '刷新失败' : '加载失败',
          icon: 'error'
        })
        this.setData({
          "option.loading": false
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.message || (forceRefresh ? '刷新失败' : '加载失败'),
        icon: 'error'
      })
      this.setData({
        "option.loading": false
      })
    })
  },

  checkCache() {
    const cache = wx.getStorageSync('productListCache');
    if (!cache) return null;
    
    const { timestamp, data } = cache;
    const now = new Date().getTime();
    
    if (now - timestamp > this.data.cacheTimeout) {
      wx.removeStorage({
        key: 'productListCache'
      });
      return null;
    }
    
    return data;
  },

  updateCache(data) {
    wx.setStorage({
      key: 'productListCache',
      data: {
        timestamp: new Date().getTime(),
        data: data
      }
    });
  },

  onReachBottom() {
    if (!this.data.option.loading && !this.data.option.loadend) {
      this.loadLikeProductList()
    }
  },

  addPost() {
    wx.switchTab({
      url: '/pages/map/map'
    })
  },

  detail(e) {
    let post = e.detail.post;
    app.$comm.navigateTo("/pages/admin/post-update/post-update?pageType=show&id=" + post._id + "&title=" + post.title + "&type=" + post.type + "&content=" + post.content + "&author=" + post.author)
  },

  onPullDownRefresh() {
    if (this.data.isRefreshing) return;
    
    this.setData({
      isRefreshing: true,
      'option.page': 1,
      'option.loadend': false,
      productList: []
    });

    this.loadLikeProductList(true).finally(() => {
      wx.stopPullDownRefresh();
      this.setData({
        isRefreshing: false
      });
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    
    this.setData({
      currentTab: tab,
      productList: [],
      'option.page': 1,
      'option.loadend': false
    });

    if (tab === 'post') {
      app.$comm.navigateTo('/pages/my/my?searchType=1');
    } else if (tab === 'reply') {
      app.$comm.navigateTo('/pages/my/my?searchType=2');
    } else if (tab === 'follow') {
      app.$comm.navigateTo('/pages/my/my?searchType=3');
    }
  },

  showActionSheet() {
    console.log('showActionSheet called');
    this.setData({
      showActionSheet: true
    });
  },

  closeActionSheet() {
    console.log('closeActionSheet called');
    this.setData({
      showActionSheet: false
    });
  },

  itemClick(e) {
    console.log('itemClick called', e.detail);
    const index = e.detail.index;
    this.setData({
      showActionSheet: false
    });
    
    // 根据选择的选项跳转到对应页面
    if (index === 0) {
      // 我的发帖
      app.$comm.navigateTo('/pages/my/my?searchType=1');
    } else if (index === 1) {
      // 我的回复
      app.$comm.navigateTo('/pages/my/my?searchType=2');
    } else if (index === 2) {
      // 我的关注
      app.$comm.navigateTo('/pages/my/my?searchType=3');
    } else if (index === 3) {
      // 我的待办
      wx.navigateTo({
        url: '/pages/my-todolist/my-todolist'
      })
    }
  },

  loadProductList(searchType = 0) {
    if (this.data.option.loading) return;
    
    this.setData({
      'option.loading': true,
      'option.page': 1,
      'option.loadend': false,
      productList: []
    });

    app.$api.loadProductList({
      page: this.data.option.page,
      limit: this.data.option.limit,
      searchType: searchType
    }).then(res => {
      if (res.code == 1) {
        this.setData({
          productList: res.data || [],
          'option.loadend': !res.data || res.data.length < this.data.option.limit,
          'option.loading': false
        });
      } else {
        this.setData({
          'option.loading': false
        });
      }
    }).catch(() => {
      this.setData({
        'option.loading': false
      });
    });
  }
})