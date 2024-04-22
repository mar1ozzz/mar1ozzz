const app = getApp();
Page({
  data: {
    tableColumns: [{
        title: "名称",
        key: "nickName",
        width: "60px"
      },
      {
        title: "状态",
        key: "isRead",
        width: "60px",
        render: val => (val ? '已读' : '未读')
      },
      {
        title: "内容",
        key: "content"
      },
      {
        title: "时间",
        key: "time"
      }
    ],
    dataList: [],
    page: 1,
    limit: 10,
    isLoad: true,


    dataInfo: {},
    showInfo: false
  },
  onShow() {
    this.initComponent();
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
    app.$api.getFeedbacklistAdmin({
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
  initComponent() {
    this.setData({
      dataList: [],
      page: 1,
      limit: 10,
      isLoad: true
    })
    this.getList();
  },
  handleClickItem(e) {
    const {
      index
    } = e.detail.value;
    let _this = this
    let dataItem = this.data.dataList[index]
    wx.showActionSheet({
      itemList: ['查看详情'],
      success(res) {
        if (res.tapIndex == 0) {
          if (!dataItem.isRead) {
            _this.chanegRead(dataItem._id)
          }
          console.log(dataItem)
          _this.setData({
            dataInfo: dataItem,
            showInfo: true
          })
        }
      },
      fail(res) {}
    })
  },
  hideInfoHandle() {
    this.setData({
      showInfo: false
    })
  },
  chanegRead(_id) {
    app.$api.updataFeedbackReadAdmin({
      _id
    }).then(res => {
      if (res.code) {
        this.data.dataInfo.isRead = true
        let info = this.data.dataList.find(item => item._id == _id)
        if (info) {
          info.isRead = true
        }
        this.setData({
          dataInfo: this.data.dataInfo,
          dataList: this.data.dataList
        })
      }
    })
  }
});