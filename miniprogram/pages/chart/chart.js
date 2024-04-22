// pages/chart/chart.js
let app = getApp()
import * as echarts from '../../components/ec-canvas/echarts'

function initChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
    });
    canvas.setChart(chart);
     app.$api.getPostAggreate().then(res => {
        console.log('datasoure1', res.data.list)
        if (res.code == 1) {
            var option = {
                legend: {},
                tooltip: {},
                dataset: {
                    // 这里指定了维度名的顺序，从而可以利用默认的维度到坐标轴的映射。
                    // 如果不指定 dimensions，也可以通过指定 series.encode 完成映射，参见后文。
                    dimensions: ['_id', '发帖数', '评星数'],
                    source: res.data.list
                },
                yAxis: {type: 'category' ,
                        data:['运维','综维','传输','优化','建设','资管','集客','光缆']},
                xAxis: {},
                series: [
                    {type: 'bar'},
                    {type: 'bar'}                   
                ]
            };
        
            chart.setOption(option);
            return chart;
        }
    })
   // console.log('datasoure2', data)
   

}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        ec: {
            onInit: initChart
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log('onload')
        /* app.$api.getPostAggreate().then(res => {
            console.log(res)
        }) */
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

})