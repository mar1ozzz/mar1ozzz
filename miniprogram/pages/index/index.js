let app = getApp()
Page({
  data: {
    searchKey: "",
    width: 200,
    height: 64,
    inputTop: 0,
    arrowTop: 0,
    dropScreenH: 0,
    timed: false,
    tabIndex: 0,
    currentStatus: 0,
    productList: [],
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆','VIP整治'],
    pickerList: ['全部','运维','综维','传输','优化','建设','资管','集客','光缆','VIP整治'],
    selectedType: '',  // 筛选使用的类型值
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
    }],
    selectedType: '' // 新增选中分类
  },

  typePickerChange(e) {
    console.log('选择的type索引:', e.detail.value);
    const selectedType = this.data.pickerList[e.detail.value];
    console.log('选择的type值:', selectedType);
    
    this.setData({
      selectedType: selectedType === '全部' ? '' : selectedType,
      'option.page': 1,
      'option.loadend': false,
      productList: []
    }, () => {
      console.log('更新后的selectedType:', this.data.selectedType);
      this.loadLikeProductList(true);
    });
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
    const filteredPosts = wx.getStorageSync('filtered_posts');
    
    this.setData({
      'option.page': 1,
      'option.loadend': false,
      productList: [],
      filteredPostIds: filteredPosts && filteredPosts.length > 0 ? filteredPosts : null
    });
    
    if (filteredPosts && filteredPosts.length > 0) {
      wx.removeStorageSync('filtered_posts');
    }
    
    this.loadLikeProductList(true)
  },

  onHide() {
    wx.removeStorage({
      key: 'productListCache'
    })
  },

  onUnload() {
    wx.removeStorage({
      key: 'productListCache'
    })
  },

  handleStatusChange(e) {
    const status = parseInt(e.currentTarget.dataset.index);
    console.log('当前状态:', status);
    this.setData({
      currentStatus: status,
      'option.page': 1,
      'option.loadend': false,
      productList: []
    });
    this.loadLikeProductList(true);
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
        this.loadLikeProductList(true)
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
        this.loadLikeProductList(true)
      })
    } else if (index == 1) {
      // 按分类筛选
      wx.showActionSheet({
        itemList: ['全部', '运维', '综维', '传输', '优化', '建设', '资管', '集客', '光缆','VIP整治'],
        success: (res) => {
          const types = ['', '运维', '综维', '传输', '优化', '建设', '资管', '集客', '光缆','VIP整治']
          this.setData({
            selectedType: types[res.tapIndex],
            'option.page': 1,
            'option.loadend': false,
            productList: []
          }, () => {
            this.loadLikeProductList(true)
          })
        }
      })
    }
  },

  loadLikeProductList(forceRefresh = false) {
    let { page, limit, loadend } = this.data.option;
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
    
    wx.showLoading({
      title: forceRefresh ? '刷新中...' : '加载中...',
      mask: true
    });
  
    const db = wx.cloud.database();
    const _ = db.command;
    let query = {};
    
    // 如果有过滤的帖子ID列表，优先使用
    if (this.data.filteredPostIds) {
      query._id = _.in(this.data.filteredPostIds);
    } else {
      // 添加状态筛选
      if (this.data.currentStatus === 1) {
        query.当前状态 = _.in(['待回复', '建设中', '规划中', '暂挂中', '待处理']);
      } else if (this.data.currentStatus === 2) {
        query.当前状态 = '已解决';
      }
      
      // 添加type筛选
      if (this.data.selectedType) {
        query.type = this.data.selectedType;
      }
    
      // 添加搜索关键词
      if (this.data.searchKey) {
        query.product_name = db.RegExp({
          regexp: this.data.searchKey,
          options: 'i'
        });
      }
    
      // 如果不是管理员，只显示自己的帖子
      const userInfo = getApp().globalData.userInfo;
      if (!userInfo.isAdmin) {
        query.author = userInfo.username;
      }
    }
    
    console.log('查询条件:', query);
  
    return db.collection('post')
      .where(query)
      .orderBy('product_time', this.data.timed ? 'asc' : 'desc')
      .orderBy('comment', 'desc')
      .orderBy('watch', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()
      .then(res => {
        wx.hideLoading();
        let proList = res.data || [];
        
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
              if (page === 1) {
                this.updateCache(newList);
              }
              this.setData({
                "option.loadend": true,
                "option.loading": false
              });
            } else {
              this.setData({
                "option.page": ++page,
                "option.loading": false
              }, () => {
                if (proList.length === limit) {
                  this.loadLikeProductList(forceRefresh);
                }
              });
            }
          }
        };
        
        updateData();
      })
      .catch(err => {
        console.error('查询失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: err.message || (forceRefresh ? '刷新失败' : '加载失败'),
          icon: 'error'
        });
        this.setData({
          "option.loading": false
        });
      });
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
    
    if (index === 0) {
      app.$comm.navigateTo('/pages/my/my?searchType=1');
    } else if (index === 1) {
      app.$comm.navigateTo('/pages/my/my?searchType=2');
    } else if (index === 2) {
      app.$comm.navigateTo('/pages/my/my?searchType=3');
    } else if (index === 3) {
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
