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

    ViewImage(e) {      
      wx.previewImage({
        urls: [e.currentTarget.dataset.url],
        current: e.currentTarget.dataset.url
      })
    },
    substr(e){
      console.log(e)
      return e
    }

  }
 
})