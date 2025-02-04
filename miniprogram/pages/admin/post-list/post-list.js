const app = getApp();
Page({
  data: {
    tableColumns: [{
      title: "名称",
      key: "product_name",
    }, {
      title: "图片",
      key: "product_img_list",
      render: function (val) {
        return val[0]
      },
      type: 'img',
      imgWidth: '50px',
      imgHeight: '50px'
    }, {
      title: "分类",
      key: "product_type"
    }, {
      title: "价格",
      key: "product_price"
    }, {
      title: "销量",
      key: "product_sales"
    }],
    dataList: [],
    page: 1,
    limit: 10,
    isLoad: true
  },
  onShow() {
    this.initComponent();
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
    app.$api.getProductlistAdmin({
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
    let menuList = ['查看详情', '数据修改', '数据删除']
    wx.showActionSheet({
      itemList: menuList,
      success: (res) => {
        let tapIndex = res.tapIndex
        if (tapIndex == 0) {
          this.showHandle(index)
        } else if (tapIndex == 1) {
          this.updateProductHandle(index)
        } else if (tapIndex == 2) {
          this.delProductHandle(index)
        }
      }
    })
  },
  delProductHandle(index) {
    let {
      dataList
    } = this.data
    let info = dataList[index]
    wx.showModal({
      title: '提示',
      content: '是否确定删除该数据？',
      success: (res) => {
        if (res.confirm) {
          app.$api.delProductAdmin({
            _id: info._id
          }).then(res => {
            if (res.code) {
              app.$comm.successToShow(res.msg, () => {
                dataList.splice(index, 1)
                this.setData({
                  dataList
                })
              })
            }
          })
        }
      }
    })
  },
  updateProductHandle(index) {
    let {
      dataList
    } = this.data
    let info = dataList[index]
    info = JSON.stringify(info)
    app.$comm.navigateTo(`/pages/admin/product-update/product-update?info=${info}&pageType=update`)
  },
  showHandle(index) {
    let {
      dataList
    } = this.data
    let info = dataList[index]
    info = JSON.stringify(info)
    app.$comm.navigateTo(`/pages/admin/post-update/post-update?info=${info}&pageType=show`)
  },
  addHandle() {
    app.$comm.navigateTo(`/pages/admin/post-update/post-update`)
  }
});