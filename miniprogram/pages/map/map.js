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
    classifyList: ['运维','综维','传输','优化','建设','资管','集客','光缆'],  // 实际的类型列表
    pickerList: ['全部','运维','综维','传输','优化','建设','资管','集客','光缆'],  // picker显示的完整列表
    mapSelectedType: '',  // 地图筛选使用的类型值
    formData: {
      title: '',
      content: '',
      type: '',  // 表单选中的类型
      images: []
    },
    searchKeyword: '',
    searchResults: [],
    showSearchResults: false,
    hideTip: false,
    scale: 8,
    enableSatellite: false,
    showClassifyList: false
  },

  onLoad: function(options) {
    this.getdata();
    
    // 30秒后隐藏提示栏
    setTimeout(() => {
      this.setData({
        hideTip: true
      });
    }, 30000);
  },

  getdata: function() {
    wx.showLoading({
      title: '加载中...',
    });
  
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    const db = wx.cloud.database();
    
    let query = {};
    
    // 如果不是管理员，只显示自己的地图点
    if (!userInfo.isAdmin) {
      query.author = userInfo.username;
    }
    
    // 如果不是"全部"，添加type筛选条件
    if (this.data.mapSelectedType) {  // 使用mapSelectedType进行筛选
      query.type = this.data.mapSelectedType;
    }
  
    db.collection('post')
      .where(query)
      .skip(this.data.markers.length)
      .limit(20)
      .get()
      .then(res => {
        const newMarkers = res.data.map((item, index) => {
          let iconPath;
          switch (item.当前状态) {
            case '建设中': iconPath = "../../static/icon/建设中.png"; break;
            case '规划中': iconPath = "../../static/icon/规划中.png"; break;
            case '暂挂中': iconPath = "../../static/icon/暂挂中.png"; break;
            case '待回复': iconPath = "../../static/icon/待回复.png"; break;
            case '已解决': iconPath = "../../static/icon/已解决.png"; break;
          }
          let [gcjLng, gcjLat] = app.coordTransform.toGCJ02(item.经度, item.纬度);
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
            callout: { content: "", borderWidth: 0 }
          };
        });
        
        this.setData({
          markers: [...this.data.markers, ...newMarkers]
        });
        
        if (res.data.length > 0) {
          this.getdata();  // 如果还有数据，继续加载
        } else {
          wx.hideLoading();
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
    const { latitude, longitude } = e.detail;  // 从地图获取的是GCJ02
    let wgsCoords = app.coordTransform.toWGS84(longitude, latitude);
    
    // 添加临时标记
    const markers = this.data.markers.filter(m => m.id !== 'temp');
    markers.push({
      id: 'temp',
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      iconPath: "../../static/icon/待回复.png",
      width: 30,
      height: 30
    });
    
    this.setData({
      markers,
      showForm: true,
      wgslatitude: wgsCoords.lat,  // 已经在转换工具中处理过小数位
      wgslongitude: wgsCoords.lng
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

  // 地图上方的分类筛选
  classifyPickerChange: function(e) {
    const selectedType = this.data.pickerList[e.detail.value];
    this.setData({
      mapSelectedType: selectedType === '全部' ? '' : selectedType,  // 使用mapSelectedType
      markers: [] // 清空现有的标记
    });
    this.getdata(); // 重新获取数据
},

  // 表单中的分类选择
  formClassifyPickerChange: function(e) {
    const selectedType = this.data.classifyList[e.detail.value];
    this.setData({
      'formData.type': selectedType,  // 更新表单数据
      classifyIndex: e.detail.value   // 更新索引，但不触发地图更新
    });
},

  chooseImageHandle: function(e) {
    console.log('图片上传完成：', e.detail);
    this.setData({
      product_img_list: e.detail.imgArr || []
    });
  },

  formSubmit: function(e) {
    console.log('formSubmit triggered', e.detail.value);  // 添加调试信息
    
    let { product_img_list, wgslatitude, wgslongitude, formData } = this.data;
    
    // 从表单中获取数据
    let option = e.detail.value;
    
    console.log('formData:', formData);  // 添加调试信息
    console.log('option before:', option);  // 添加调试信息
    
    // 使用formData中的type
    option.type = formData.type;
    option.product_img_list = product_img_list;

    console.log('option after:', option);  // 添加调试信息

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

    // 验证类型是否已选择
    if (!option.type) {
      app.$comm.errorToShow('请选择类型');
      return false;
    }

    // 添加作者信息和位置信息
    Object.assign(option, {
      author: app.globalData.userInfo.username,
      author_id: app.globalData.userInfo.OPENID,
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

  preventTouchMove: function() {
    // 阻止滑动穿透
    return;
  },

  onSearch: function() {
    const keyword = this.data.searchKeyword;
    if (!keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '搜索中...'
    });

    const url = `https://apis.map.qq.com/ws/place/v1/search?boundary=nearby(${this.data.latitude},${this.data.longitude},1000)&keyword=${encodeURIComponent(keyword)}&page_size=10&page_index=1&key=WSHBZ-AVDCL-XVQPC-MBUNI-MB4XS-KVBAZ`;
    
    wx.request({
      url: url,
      success: (res) => {
        if (res.data.status === 0 && res.data.data.length > 0) {
          const searchResults = res.data.data.map(item => ({
            name: item.title,
            address: item.address,
            latitude: item.location.lat,
            longitude: item.location.lng
          }));
          
          this.setData({
            searchResults,
            showSearchResults: true
          });
        } else {
          wx.showToast({
            title: '未找到相关位置',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error(error);
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  onInput: function(event) {
    this.setData({ 
      searchKeyword: event.detail.value,
      showSearchResults: false 
    });
  },

  selectLocation: function(e) {
    const { latitude, longitude } = e.currentTarget.dataset; // 获取 GCJ02 坐标
  
    // 创建临时标记，使用 GCJ02 坐标
    const tempMarker = {
      id: 'temp',
      latitude: latitude, // 使用 GCJ02 纬度
      longitude: longitude, // 使用 GCJ02 经度
      iconPath: "../../static/icon/待回复.png",
      width: 30,
      height: 30
    };
  
    // 更新地图中心点位置和标记，使用 GCJ02 坐标
    this.setData({
      latitude: latitude,
      longitude: longitude,
      showSearchResults: false,
      searchKeyword: '',
      markers: [...this.data.markers.filter(m => m.id !== 'temp'), tempMarker] // 移除旧的临时标记，添加新的
    });
  
    // 创建地图上下文并移动到选中位置，使用 GCJ02 坐标
    const mapContext = wx.createMapContext('myMap');
    mapContext.moveToLocation({
      latitude: latitude,
      longitude: longitude,
      success: () => {
        // 设置地图缩放级别
        this.setData({
          scale: 16  // 设置适中的缩放级别
        });
      }
    });
  
    // 显示表单，使用 WGS84 坐标
    const wgsCoords = gcj02towgs84(longitude, latitude); // 将 GCJ02 转换为 WGS84
    that.setData({
      showForm: true,
      wgslatitude: parseFloat(wgsCoords.lat.toFixed(5)), // 使用转换后的纬度
      wgslongitude: parseFloat(wgsCoords.lng.toFixed(5)) // 使用转换后的经度
    });
  },

  closeSearchResults: function() {
    this.setData({
      showSearchResults: false,
      searchKeyword: ''
    });
  },

  toggleMapType: function() {
    this.setData({
      enableSatellite: !this.data.enableSatellite
    });
  },
});
