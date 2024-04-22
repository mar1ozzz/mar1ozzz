Component({

  properties: {
    // 星星图标间距设置
    margin:{
      type:Number,
      value:20
    },
    // 星星评分设置
    default:{
      type:Number,
      value:10
    }
  },

  options: {
    multipleSlots: true
  },

  data: {
    star_full: "./images/star_full.png",
    star_half: "./images/star_half.png",
    star_default: "./images/star_default.png"
  },

  /**
   * 组件的方法列表
   */
  methods: {

    //点击左边,半颗星
    _selectLeft: function(e) {
      let score = e.currentTarget.dataset.score;
      if (this.data.score == 1 && score == 1) {
        // 剩下半星时点击半星半星消失
        score = 0;
      }

      this.setData({
        default: score
      })
      this.triggerEvent("score",{score:score})
    },

    //点击右边,整颗星
    _selectRight: function(e) {
      let score = e.currentTarget.dataset.score;
      this.setData({
        default: score
      })
      this.triggerEvent("score", { score: score })      
    },
  }
})