/* 自定义函数模块:IIFE */
(function (window) {
    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'
       // excutor:执行器函数(同步执行)
    function Promise(excutor) {
        //将当前Promise对象保存起来  
        const self = this
        self.status = PENDING //给promise对象指定status属性，初始值为pending
        self.date = undefined //给promise对象一个用于储存结果数据的属性
        self.callbacks = []  //每个元素的结构{onResolved(){},onRejected(){}}
        function resolve(value) {
            //如果当前状态不是pending,直接结束
            if(self.status !== PENDING){
                return 
            }
           //将状态改为resolved
           self.status = RESOLVED
           //保存 value 数据
           self.date = value
           //如果有待执行的callback函数，立即异步执行回调 onResolved
           if (self.callbacks.length>0){
               setTimeout(() => {  //放入队列中执行所有成功的回调
                self.callbacks.forEach(callbacksObj => {
                    callbacksObj.onResolved(value)      
                   }); 
               }, 0);
           }
        }
        function reject(reason) {
             //如果当前状态不是pending,直接结束
             if(self.status !== PENDING){
                return 
            }

              //将状态改为rejected
           self.status = REJECTED
           //保存 value 数据
           self.date = reason
           //如果有待执行的callback函数，立即异步执行回调onRejectd
           if (self.callbacks.length>0){
               setTimeout(() => {  //放入队列中执行所有成功的回调
                self.callbacks.forEach(callbacksObj => {
                    callbacksObj.onRejected(reason)      
                   }); 
               }, 0);
           }
        }
        // 立即同步执行excutor
        try {
            excutor(resolve,reject)
        } catch (error) { //如果执行器抛出异常，那Promise对象变为rejected状态
            reject(error)
        }
        
    }
/* 
Promise的原型对象then() 
指定成功和失败的回调函数
返回一个新的Promise对象
*/   
Promise.prototype.then = function (onResolved,onRejected) {
     onResolved = typeof onResolved === 'function'? onResolved : value => value; //向后传递成功的value
      //指定默认的失败的回调 （实现异常传透的关键）
     onRejected = typeof onRejected === 'function'? onRejected : reason => {throw reason}; //向后传递失败的reason
    const self = this
    //返回一个新的Promise对象  
    return new Promise ((resolve,reject) => {
        /* 调用回调函数处理  根据执行结果改变 return的Promise状态*/
        function handle(callback) {
            /* 
            1.如果抛出异常  return的Promise就会失败 reason就是error
            2.如果回调函数非Promise ，return的Promise成功  value就是return的值 
            3.如果回调函数返回的是Promise，return的Promise结果就是这个Promise结果
            */
            try {
                const result = callback(self.date)
                if (result instanceof Promise){
                 //    result 成功时 让return的Promise也成功
                 //    result 失败时 让return的Promise也失败                  
                     result.then(resolve,reject)
                }else{
                 // 2.如果回调函数非Promise ，return的Promise成功  value就是return的值 
                 resolve(result)
                }
             } catch (error) {
                 // 1.如果抛出异常  return的Promise就会失败 reason就是error
                 reject(error)
        }
        }
    
        if (self.status === PENDING){
            //当前状态还是pending,将回调函数保存起来
        self.callbacks.push({
            onResolved(value){
                handle(onResolved)
            }
            ,onRejected(reson){
                handle(onRejected)
            }
        })  
        }else if(self.status === RESOLVED){ //如果当前是resolved状态，异步执行onResolved并改变return的Promise状态
            
            setTimeout(() => {
                handle(onResolved)
            }, 0)
        }else{ //如果当前是rejected状态，异步执行onRejected并改变return的Promise状态
            //rejected
            setTimeout(() => {
               handle(onRejected)
            }, 0)
        } 
        })
    }
    
/*
 Promise的原型对象catch()
执行失败的回调函数
返回一个新的Promise对象
*/
Promise.prototype.catch = function (onRejected) {
  return this.then(undefined,onRejected) 
}
/* 
 Promise函数对象的resolve方法 
 返回一个指定结果成功的Promise
 */
Promise.resolve = function (value) {
    //返回一个成功/失败的Promise
    return new Promise((resolve,reject) =>
    {
        if (value instanceof Promise){//使用value的结果作为Promise的结果
            value.then(resolve,reject)
        }else{ //value不是Promise => promise变为成功，数据是value 
            resolve(value)
        }
    })
    //value 是Promise
    
}
/* 
Promise函数对象的reject方法  
返回一个指定Reason失败的Promise
*/
Promise.reject = function (reason) {
    //返回一个失败的Promise
   return new Promise ((resolve,reject) =>
   {
       reject(reason);
   })
}
/* 
Promise函数对象的all方法
返回一个Promise 只有全部成功才成功，否则失败 
 */
Promise.all = function (promises) {
    let values = new Array() //用来保存所有的value数组
    return new Promise((resolve,reject)=> {
    //遍历获取每个Promise的结果
    promises.forEach(p =>{
        Promise.resolve(p).then(
            value =>{//p成功，将成功的value保存到values
                values.push(value)
                if (values.length === promises.length){
                    resolve(values)
                }
            },
            reason =>{
                reject(reason)
            }
        )
    })
    })
}
/* Promise函数对象的race方法 
返回一个Promise，其结果由第一个完成的Promise决定
*/

Promise.race  = function (promises) {
    //返回一个Promise
    return new Promise((resolve,reject)=>{
        promises.forEach(p =>{
            Promise.resolve(p).then(resolve,reject)
        })   
    })
}
/* 
返回一个Promise对象，在指定的时间后才确定结果
*/
Promise.resolveDelay = function name(value,time) {
    return new Promise((resolve,reject) =>
    {
        setTimeout(() => {
            if (value instanceof Promise){//使用value的结果作为Promise的结果
                value.then(resolve,reject)
            }else{ //value不是Promise => promise变为成功，数据是value 
                resolve(value)
            }  
        }, time);
        
    })  
}
/* 
返回一个Promise对象，在指定的时间后才失败
*/
Promise.rejectDelay = function name(reason,time) {
    return new Promise ((resolve,reject) =>
    {
        setTimeout(() => {
            reject(reason);
        }, time);
      
    }) 
}


// 向外暴露Promise
window.Promise = Promise
}
)(window)