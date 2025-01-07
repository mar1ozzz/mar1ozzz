const db = wx.cloud.database()
const app = getApp()

// WGS84转GCJ02
function wgs84togcj02(wgsLng, wgsLat) {
  const PI = 3.14159265358979324;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function outOfChina(lng, lat) {
      if (lng < 72.004 || lng > 137.8347) return true;
      if (lat < 0.8293 || lat > 55.8271) return true;
      return false;
  }

  function transformLat(x, y) {
      let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
      return ret;
  }

  function transformLng(x, y) {
      let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
      return ret;
  }

  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
  let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
  let radLat = wgsLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  let gcjLat = wgsLat + dLat;
  let gcjLng = wgsLng + dLng;
  return [gcjLng, gcjLat];
}

// GCJ02 转 WGS84
function gcj02towgs84(gcjLng, gcjLat) {
  if (!gcjLng || !gcjLat) return null;
  
  const PI = 3.14159265358979324;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  }

  let dLat = transformLat(gcjLng - 105.0, gcjLat - 35.0);
  let dLng = transformLng(gcjLng - 105.0, gcjLat - 35.0);
  let radLat = gcjLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  
  return {
    lat: gcjLat - dLat,
    lng: gcjLng - dLng
  };
}

Page({
  data: {
    longitude: "104.71465",
    latitude: "31.46402",
    markers: [],
    showForm: false,
    wgslatitude: '',
    wgslongitude: '',
    formData: {
      title: '',
      content: '',
      type: ''
    },
    product_img_list: [],
    classifyList: ['运维', '开发', '测试', '其他'],
    classifyIndex: 0
  },

  onLoad: function(options) {
    this.getdata();
  },

  getdata: function() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    const db = wx.cloud.database();
    const _ = db.command;
    
    let query = {};
    
    // 如果不是管理员，只显示自己的地图点
    if (!userInfo.isAdmin) {
      query.author = userInfo.username;
    }
    
    db.collection('post')
      .where(query)
      .skip(this.data.markers.length) 
      .get() 
      .then(res => { 
        console.log(res); 
        const newMarkers = res.data.map((item,index) => {
          let iconPath;
          switch (item.当前状态) {
            case '建设中': 
            case '规划中': 
              iconPath = "../../static/icon/规建.png";
              break;
            case '暂挂中': 
            case '待回复': 
              iconPath = "../../static/icon/待回复.png";
              break;
            case '已解决': 
            default: 
              iconPath = "../../static/icon/已解决.png";
              break;
          }
          let [gcjLng, gcjLat] = wgs84togcj02(item.经度, item.纬度);
          const markerId = this.data.markers.length + index;
        return {
          id: markerId, 
          _id: item._id,
          longitude: gcjLng, 
          latitude: gcjLat, 
          iconPath: iconPath, 
          title: item.title, 
          width: 30, 
          height: 30, 
          type: item.type,
          author: item.author,
          content: item.content,
          callout: {
            content:"",
            borderWidth:0
        } 
        };
      });
      this.setData({
        markers: [...this.data.markers, ...newMarkers] 
      });
      
      if (res.data.length > 0) {
        this.getdata();
      } else {
        wx.hideLoading({ 
          success: (res) => {
          }
        });
      }
    })
    .catch(err => { 
      console.error('获取数据失败', err); 
      wx.hideLoading(); 
    });
  },

  detail(e){
    let post=e.detail.post
     app.$comm.navigateTo("/pages/admin/post-update/post-update?pageType=show&id=" + this.data.markers[e.detail.markerId]._id+"&title="+this.data.markers[e.detail.markerId].title+"&type="+this.data.markers[e.detail.markerId].type+"&content="+this.data.markers[e.detail.markerId].content+"&author="+this.data.markers[e.detail.markerId].author)
  },

  onMapTap: function(e) {
    console.log('地图被点击：', e.detail);
    const { latitude, longitude } = e.detail;
    
    // 添加临时标记
    const markers = this.data.markers.filter(m => m.id !== 'temp');
    markers.push({
      id: 'temp',
      latitude,
      longitude,
      iconPath: "../../static/icon/待回复.png",
      width: 30,
      height: 30
    });
    
    this.setData({
      markers,
      showForm: true,
      wgslatitude: latitude.toFixed(5),
      wgslongitude: longitude.toFixed(5)
    });
  },

  hideForm: function() {
    console.log('关闭表单');
    // 移除临时标记
    const markers = this.data.markers.filter(m => m.id !== 'temp');
    
    this.setData({
      showForm: false,
      markers,
      formData: {
        title: '',
        content: '',
        type: ''
      },
      product_img_list: []
    });
  },

  stopPropagation: function() {
    return false;
  },

  classifyPickerChange: function(e) {
    this.setData({
      classifyIndex: e.detail.value
    });
  },

  chooseImageHandle: function(e) {
    console.log('图片上传完成：', e.detail);
    this.setData({
      product_img_list: e.detail.imgArr || []
    });
  },

  formSubmit: function(e) {
    let { product_img_list, wgslatitude, wgslongitude, classifyList, classifyIndex } = this.data;
    
    // 从表单中获取数据
    let option = e.detail.value;
    
    // 确保类型正确设置
    option.type = classifyList[classifyIndex];
    option.product_img_list = product_img_list;

    // 表单验证
    let valLoginRes = app.$validate.validate(option, [{
      name: 'title',
      type: 'required',
      errmsg: '标题不能为空'
    }, {
      name: 'content',
      type: 'required',
      errmsg: '详情不能为空'
    }]);

    if (!valLoginRes.isOk) {
      app.$comm.errorToShow(valLoginRes.errmsg);
      return false;
    }

    // 添加作者信息和位置信息
    Object.assign(option, {
      author: app.globalData.userInfo.username,
      author_id: app.globalData.userInfo.OPENDID,
      author_belong: app.globalData.userInfo.quxian,
      经度: parseFloat(wgslongitude),
      纬度: parseFloat(wgslatitude),
      当前状态: "待回复"
    });

    console.log('提交的数据：', option);

    // 提交数据
    app.$api.addPostAdmin(option).then(res => {
      if (res.code) {
        app.$comm.successToShow("添加成功", () => {
          this.setData({
            showForm: false,
            formData: {
              title: '',
              content: '',
              type: ''
            },
            product_img_list: []
          });
          this.getdata(); // 重新加载地图数据
          wx.reLaunch({
            url: '/pages/map/map' // 替换为你的页面路径
          });
        });
      } else {
        app.$comm.errorToShow(res.msg || '添加失败');
      }
    }).catch(err => {
      console.error('提交失败：', err);
      app.$comm.errorToShow('提交失败，请重试');
    });
  },

  preventTouchMove() {
    // 阻止滑动穿透
    return;
  }
});
