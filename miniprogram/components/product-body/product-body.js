let app = getApp()
Component({
  properties: {
    mode: {
      type: String,
      value: "two"
    },
    data: {
      type: Array,
      value: []
    }
  },
  data: {
    zhuangtaiList: ['待回复','规划中','建设中','暂挂中','已解决']
  },
  methods: {
    detail(e) {      
      let post = e.currentTarget.dataset.info
      console.log('post',post)
      this.triggerEvent("detail",{'post':post})
    },
    getStatus(status) {
      return status || '待回复';
    },
    isStatusDone(status) {
      return status === '已解决';
    }
  }
})