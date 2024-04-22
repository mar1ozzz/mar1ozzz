Component({
  externalClasses: ['tui-upload-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    //初始化图片路径
    value: {
      type: Array,
      value: []
    },
    //禁用删除
    forbidDel: {
      type: Boolean,
      value: false
    },
    //禁用添加
    forbidAdd: {
      type: Boolean,
      value: false
    },
    //限制数
    limit: {
      type: Number,
      value: 9
    },
    //图片上传的文件夹
    catalogue: {
      type: String,
      value: ""
    }
  },
  lifetimes: {
    ready: function () {
      console.log('properties',this.properties.value)
      let imgArr = [...this.data.value]
      let status = []
      for (let item of imgArr) {
        status.push("1")
      }
      this.setData({
        imageList: [...imgArr],
        statusArr: status
      })     
      this.change()
    }
  },
  data: {
    //图片地址
    imageList: [],
    //上传状态：1-上传成功 2-上传中 3-上传失败
    statusArr: [],

    //进入上传请求图片的数目
    uploadNum: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 重新上传
    reUpLoad(e) {
      let index = Number(e.currentTarget.dataset.index)
      let value = `statusArr[${index}]`
      this.setData({
        [value]: "2"
      })
      this.change()
      this.uploadImage(index, this.data.imageList[index]).then(() => {
        this.change()
      }).catch(() => {
        this.change()
      })
    },
    change() {
      let status = ~this.data.statusArr.indexOf("2") ? 2 : 1
      if (status != 2 && ~this.data.statusArr.indexOf("3")) {
        // 上传失败
        status = 3
      }
      this.triggerEvent('complete', {
        status: status,
        imgArr: this.data.imageList
      })
    },
    chooseImage: function () {
      let _this = this;
      wx.chooseImage({
        count: _this.data.limit - _this.data.imageList.length,
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
        success: function (e) {
          let imageArr = [];
          let status = []
          for (let i = 0; i < e.tempFilePaths.length; i++) {
            let len = _this.data.imageList.length;
            if (len >= _this.data.limit) {
              wx.showToast({
                title: `最多可上传${_this.data.limit}张图片`,
                icon: "none"
              });
              break;
            }
            let path = e.tempFilePaths[i]
            imageArr.push(path)
            status.push("2")
          }
          _this.setData({
            imageList: _this.data.imageList.concat(imageArr),
            statusArr: _this.data.statusArr.concat(status)
          })
          _this.change()

          let start = _this.data.imageList.length - imageArr.length
          for (let j = 0; j < imageArr.length; j++) {
            let index = start + j
            _this.uploadImage(index, imageArr[j]).then(() => {
              _this.change()
            }).catch(() => {
              _this.change()
            })
          }
        }
      })
    },
    showLoading() {
      let {
        uploadNum
      } = this.data
      if (uploadNum === 0) {
        wx.showLoading({
          title: '上传图片中...',
        })
      }
      uploadNum++
      this.setData({
        uploadNum
      })
    },
    hideLoading() {
      let {
        uploadNum
      } = this.data
      uploadNum--
      if (uploadNum === 0) {
        wx.hideLoading()
      }
      this.setData({
        uploadNum
      })
    },
    uploadImage: function (index, filePath) {
      let _this = this;
      let {
        catalogue
      } = this.data
      let status = `statusArr[${index}]`;
      // this.showLoading()
      let suffix = /\.[^\.]+$/.exec(filePath)[0];
      return new Promise((reslove, reject) => {
        wx.cloud.uploadFile({
          cloudPath: (catalogue ? catalogue + '/' : '') + new Date().getTime() + suffix,
          filePath: filePath
        }).then(res => {
          // _this.hideLoading()
          let url = res.fileID
          if (url) {
            let value = `imageList[${index}]`
            _this.setData({
              [value]: url
            })
          }
          _this.setData({
            [status]: url ? "1" : "3"
          })
          reslove(index)
        }).catch(error => {
          // _this.hideLoading()
          _this.setData({
            [status]: "3"
          })
          reject(index)
        })
      })
    },
    delImage: function (e) {
      wx.showModal({
        title: '提示',
        content: '确定要删除这张图吗？',
        cancelText: '再看看',
        confirmText: '再见',
        success: res => {
          if (res.confirm) {
            let index = Number(e.currentTarget.dataset.index)
            let imgList = [...this.data.imageList]
            let status = [...this.data.statusArr]
            let delSrc = imgList.splice(index, 1)
            status.splice(index, 1)
            this.setData({
              imageList: imgList,
              statusArr: status
            })
            this.triggerEvent("remove", {
              index: index
            })
            // wx.cloud.deleteFile({
            //   fileList: delSrc
            // })
            this.change()
          }
        }
      })
    },
    previewImage: function (e) {
      let index = Number(e.currentTarget.dataset.index)
      if (!this.data.imageList.length) return;
      wx.previewImage({
        current: this.data.imageList[index],
        loop: true,
        urls: this.data.imageList
      })
    }
  }
})