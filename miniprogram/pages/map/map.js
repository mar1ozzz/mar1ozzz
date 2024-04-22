const db = wx.cloud.database()
let app = getApp()
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

Page({
  // 页面的初始数据
  data: {
    longitude: "104.71465", // 初始经度
    latitude: "31.46104",  // 初始纬度
    markers: [], // 定义一个用于存储标记对象的数组
  },
  // 页面加载时执行的函数

  onLoad: function(option) {
    this.getdata(); // 调用 getdata 函数来初始化数据
    
  },
  // 获取数据的函数
  getdata: function() {
    var that = this; // 保存当前页面的引用
    wx.showLoading({ // 显示加载提示
      title: '加载中',
    });
    // 调用云数据库的集合并跳过已经加载的标记
    wx.cloud.database().collection('post')
      .skip(that.data.markers.length) // 根据已加载的标记数量跳过记录
      .get() // 获取集合中的数据
      .then(res => { // Promise 成功回调
        console.log(res); // 在控制台打印查询结果
        // 使用 map 创建新的标记对象数组
        const newMarkers = res.data.map((item,index) => {
          let iconPath;
          switch (item.当前状态) {
            case '建设中': iconPath = "../../static/icon/规建.png";
              break;
            case '规划中':iconPath = "../../static/icon/规建.png";
              break;
            case '暂挂中':iconPath = "../../static/icon/待回复.png";
              break;
            case '待回复':iconPath = "../../static/icon/待回复.png";
              break;
            case '已解决':iconPath = "../../static/icon/已解决.png";
              break;
    // 添加更多的类别和对应的图标路径
            default:iconPath = "../../static/icon/已解决.png";} // 默认图标路径
            let [gcjLng, gcjLat] = wgs84togcj02(item.经度, item.纬度);
            const markerId = that.data.markers.length + index;
          return {
            id: markerId, // 从查询结果中获取文档ID
            _id: item._id,
            longitude: gcjLng, // 从查询结果中获取经度
            latitude: gcjLat, // 从查询结果中获取纬度
            iconPath: iconPath, // 标记图标的路径
            title: item.title, // 标记的标题，这里使用了点位名称
            width: 30, // 标记图标的宽度
            height: 30, // 标记图标的高度
            type: item.type,
            author: item.author,
            content: item.content,
            callout: {
              content:"",
              borderWidth:0
          } /*{ // 标记点上方的气泡窗口设置
              content: item.title, // 气泡窗口的标题内容
              color: "red", // 气泡窗口文字的颜色
              fontSize: 12, // 气泡窗口文字的字体大小
              padding: 12, // 气泡窗口的内边距
              borderColor: "red", // 气泡窗口边框的颜色
              display: "BYCLICK", // 点击时显示气泡窗口
              borderRadius: 1, // 气泡窗口的圆角
              borderWidth: 2, // 气泡窗口边框的宽度
              bgColor: "#ffffff", // 气泡窗口的背景颜色
              textAlign: "center", // 气泡窗口内容的对齐方式
              // 您可以根据需要添加更多属性，例如描述信息等
            },*/
          };
        });
        // 使用 setData 更新页面的 markers 数组
        that.setData({
          markers: that.data.markers.concat(newMarkers) // 合并新旧标记数组
        });
        
        // 如果查询结果不为空，继续获取下一页数据
        if (res.data.length !== 0) {
          that.getdata();
        } else {
          // 如果没有更多数据，隐藏加载提示
          wx.hideLoading({
            success: (res) => {
              // 隐藏加载提示的回调函数
            }
          });
        }
      })
      .catch(err => { // Promise 失败回调
        console.error('获取数据失败', err); // 打印错误信息
        wx.hideLoading(); // 隐藏加载提示
      });
  },
  detail(e){
     /*console.log('返回markers',this.data.markers)
     console.log('返回e的值',e)
     console.log('返回中的e的markerId',e.detail.markerId)
     console.log('返回e事件中markers数组中的值',this.data.markers[e.detail.markerId])*/
    let post=e.detail.post
     app.$comm.navigateTo("/pages/admin/post-update/post-update?pageType=show&id=" + this.data.markers[e.detail.markerId]._id+"&title="+this.data.markers[e.detail.markerId].title+"&type="+this.data.markers[e.detail.markerId].type+"&content="+this.data.markers[e.detail.markerId].content+"&author="+this.data.markers[e.detail.markerId].author)
  },
  addPost(){
  app.$comm.navigateTo('/pages/admin/post-update/post-update')
  },
  
});
