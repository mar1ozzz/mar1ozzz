const app = getApp();
Page({
  data: {
    tableColumns: [{
      title: "姓名",
      key: "username",
    },{
      title: "电话",
      key: "phone",
      width:"200rpx"
    }, 
    {
      title: "审核",
      key: "isGrant",
      render: function (val) {
        return val=='true'? '已审核' : '未审核'
      }
    }, {
      title: "权限",
      key: "isAdmin",
      render: function (val) {
        return val ? '管理员' : '用户'
      }
    }],
    dataList: [],
    showModal: false,
    userMoney: '',
    userId: ''
  },

  onLoad() {
    this.initComponent();
  },

  initComponent() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.getList();
  },

  getList() {
    // 一次性获取所有用户数据
    app.$api.getUserlist({
      page: 1,
      limit: 999999 // 设置一个足够大的数字以获取所有数据
    }).then(res => {
      wx.hideLoading();
      if (res.code) {
        // 对数据按创建时间倒序排序
        const sortedList = res.data.sort((a, b) => {
          return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // 未审核的用户排在前面
        const finalList = sortedList.sort((a, b) => {
          if (a.isGrant === 'true' && b.isGrant !== 'true') return 1;
          if (a.isGrant !== 'true' && b.isGrant === 'true') return -1;
          return 0;
        });

        this.setData({
          dataList: finalList
        });
      } else {
        wx.showToast({
          title: '获取用户列表失败',
          icon: 'error'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '获取用户列表失败',
        icon: 'error'
      });
    });
  },

  handleClickItem(e) {
    const {
      index
    } = e.detail.value;
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    let menuList = ['确认用户','设为管理员', '删除用户']
    if (dataItem.isAdmin) {
      menuList[1] = '撤销管理员'
    }
    wx.showActionSheet({
      itemList: menuList,
      success: (res) => {
        let tapIndex = res.tapIndex
        if(tapIndex == 0){
          this.confirmUser(index)
        }
        if (tapIndex == 1) {
          this.updateAdmin(index)
        } 
        if(tapIndex == 2){
          this.deleteUser(index)
        }
      }
    })
  },

  deleteUser(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    wx.showModal({
      title: '提示',
      content: '确认删除该用户吗？',
      success: (res) => {
        if (res.confirm) {
          app.$api.userDelete({
            _id: dataItem._id
          }).then(res => {
            if (res.code) {
              dataList.splice(index, 1)
              this.setData({
                dataList
              })
              app.$comm.successToShow('删除成功')
            }
          })
        }
      }
    })
  },

  updateAdmin(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    let content = dataItem.isAdmin ? '确认撤销管理员权限吗？' : '确认设置为管理员吗？'
    wx.showModal({
      title: '提示',
      content: content,
      success: (res) => {
        if (res.confirm) {
          let promise = null
          if (dataItem.isAdmin) {
            promise = app.$api.cancelAdmin({
              _id: dataItem._id
            })
          } else {
            promise = app.$api.setAdmin({
              _id: dataItem._id
            })
          }
          promise.then(res => {
            if (res.code) {
              dataItem.isAdmin = !dataItem.isAdmin
              this.setData({
                dataList
              })
              app.$comm.successToShow('修改成功')
            }
          })
        }
      }
    })
  },

  confirmUser(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    wx.showModal({
      title: '提示',
      content: '确认该用户吗？',
      success: (res) => {
        if (res.confirm) {
          app.$api.userConfirm({
            _id: dataItem._id
          }).then(res => {
            if (res.code) {
              dataItem.isGrant = 'true'
              this.setData({
                dataList
              })
              app.$comm.successToShow('确认成功')
            }
          })
        }
      }
    })
  },

  showModalHandle(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    this.setData({
      showModal: true,
      userId: dataItem._id
    })
  },

  userMoneyInputHandle(e) {
    this.setData({
      userMoney: e.detail.value
    })
  },

  hideModalHandle() {
    this.setData({
      showModal: false,
      userMoney: ''
    })
  },

  userMoneyClickHandle() {
    let {
      userMoney,
      userId
    } = this.data
    if (!userMoney) {
      app.$comm.errorToShow('请输入金额')
      return
    }
    app.$api.updateUserMoney({
      _id: userId,
      money: userMoney
    }).then(res => {
      if (res.code) {
        this.hideModalHandle()
        app.$comm.successToShow('修改成功')
      }
    })
  }
});