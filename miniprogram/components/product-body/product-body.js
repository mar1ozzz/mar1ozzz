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
  methods: {
    detail(e) {      
      let post = e.currentTarget.dataset.info
      console.log('post',post)
      this.triggerEvent("detail",{'post':post})
      
    }
  }
})