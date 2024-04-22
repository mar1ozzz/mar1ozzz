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
    page: 1,
    limit: 10,
    isLoad: true,


    showModal: false,
    userMoney: '',
    userId: ''
  },
  onLoad() {
    this.initComponent();
  },
  initComponent() {
    this.getList();
  },
  getList() {
    const {
      page,
      limit,
      dataList,
      isLoad
    } = this.data;
    if (!isLoad) {
      return;
    }
    app.$api.getUserlist({
      page: page,
      limit: limit
    }).then(res => {
      let result = res.data
      if (res.code) {
        this.setData({
          dataList: dataList.concat(result)
        })
        if (result.length < limit) {
          this.setData({
            isLoad: false
          })
        }
        this.setData({
          page: page + 1
        })
      }
    })
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
  confirmUser(index){   
    let {
      dataList
    } = this.data
   let dataItem = dataList[index]
    app.$api.userConfirm({
      _id:dataItem._id
    }).then(res=>{
      dataItem.isGrant = 'true'
      this.setData({
        dataList:dataList
      })
      console.log(res)
    })
  },
  deleteUser(index){
    let {
      dataList
    } = this.data
   let dataItem = dataList[index]
    app.$api.userDelete({
      _id:dataItem._id
    }).then(res=>{
      dataList.splice(index, 1)
      this.setData({
        dataList:dataList
      })     
    })
  },
  updateAdmin(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    if (dataItem.isAdmin) {
      app.$api.cancelAdmin({
        userId: dataItem._id
      }).then(res => {
        if (res.code) {
          dataItem.isAdmin = false
          app.$comm.successToShow(res.msg)
          this.setData({
            dataList: dataList
          })
        }
      })
    } else {
      app.$api.setAdmin({
        userId: dataItem._id
      }).then(res => {
        if (res.code) {
          dataItem.isAdmin = true
          app.$comm.successToShow(res.msg)
          this.setData({
            dataList: dataList
          })
        }
      })
    }
  },
  showModalHandle(index) {
    let {
      dataList
    } = this.data
    let dataItem = dataList[index]
    this.setData({
      showModal: true,
      userId: dataItem._id,
      userMoney: dataItem.money
    })
  },
  userMoneyInputHandle(e) {
    let {
      value
    } = e.detail
    this.setData({
      userMoney: value
    })
  },
  hideModalHandle() {
    this.setData({
      showModal: false
    })
  },
  userMoneyClickHandle() {
    let {
      userMoney,
      userId,
      dataList
    } = this.data
    if (!app.$validate.isInteger(userMoney)) {
      return app.$comm.errorToShow("请输入合理余额格式")
    }
    app.$api.updateUserMoney({
      userId,
      userMoney
    }).then(res => {
      if (res.code) {
        dataList.find(item => item._id == userId).money = userMoney
        this.hideModalHandle()
        this.setData({
          dataList
        })
      }
    })
  },
  onReachBottom() {
    this.getList()
  },
});