const Common=function(){

	this.initThreeJSContent=function(){			
		//$("#menu").css("width",constraints.video.width);
		//$("#center").css("width",constraints.video.width);
		scene = new THREE.Scene();
		//scene.background = new THREE.Color( 0x050505 );//这样设置就会导致你设置渲染alpha的透明度没作用，
		//PerspectiveCamera( fov, aspect, near, far )
		//scene.fog = new THREE.Fog( 0x333333, 1, 5 );
		//scene.fog = new THREE.FogExp2(0x333333,0.6);
		var aspect=w/h;//window.innerWidth / window.innerHeight
		aspect=constraints.video.width/constraints.video.height;
	
		camera = new THREE.PerspectiveCamera( cameraPara.fov, aspect, 0.0001, 5000 );
		camera.position.x = cameraPara.px;
		camera.position.y = cameraPara.py;
		camera.position.z = cameraPara.pz;
		camera.rotation.x =cameraPara.rx;
		camera.rotation.y =cameraPara.ry;
		camera.zoom=cameraPara.zoom;
		//camera.position.z = 300;
		scene.add( camera );

	
		var light1 = new THREE.DirectionalLight( 0xffffff, 0.8 );
		light1.position.set( -1, 1, 1 );
		scene.add( light1);

		//增加环境光
		var light2 = new THREE.AmbientLight( 0xffffff,1);
		light2.position.set( 1, 1, 1 );
		scene.add( light2);

		root = new THREE.Group();
		scene.add( root );

		console.log('camera.zooma============================camera.zoom:'+camera.zoom);
		
		//
		labelRenderer = new THREE.CSS2DRenderer();
		labelRenderer.setSize(w,h);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '1';
		labelRenderer.domElement.style.pointerEvents = 'none';
		document.getElementById( 'container' ).appendChild( labelRenderer.domElement );

		

/****/
		rendererCss3d = new THREE.CSS3DRenderer();
		rendererCss3d.setSize( w,h );
		rendererCss3d.domElement.style.position = 'absolute';
		rendererCss3d.domElement.style.top = '0';
		rendererCss3d.domElement.style.pointerEvents = 'none';
		document.getElementById( 'containercss' ).appendChild( rendererCss3d.domElement );



		raycaster = new THREE.Raycaster();

		renderer = new THREE.WebGLRenderer( { antialias: true,alpha:true } );
		//	renderer.setClearColor(0xEEEEEE, 0.0);//renderer.setClearColor(0xEEEEEE, 0.0);//或者renderer.setClearAlpha(0.0);它的意思是每次绘制清除缓冲区后的颜色通道设置，简单就是设置每次绘制的背景颜色
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( w, h );
		document.getElementById( 'container' ).appendChild( renderer.domElement );
	}
	this.render=function () {
		renderer.render( scene, camera );
		labelRenderer.render( scene, camera );
		if(rendererCss3d)
			rendererCss3d.render( scene, camera );
	}
		//加载fbx模型
	this.loadFbxModel=function (url,position,scale,comparent,mixerenable){
		var loader4 = new THREE.FBXLoader();
		loader4.load(url, function ( object ) {	//课桌
			if(mixerenable){
				mixer = new THREE.AnimationMixer( object );
				if(mixer){
					var action = mixer.clipAction( object.animations[ 0 ] );
					action.play();
				}
			}
			//object.id=2;
			comparent.add( object );
			object.scale.set(scale,scale,scale);
			object.position.copy( position );
		} );
	}
	this.fullScreen=function (element){
		var isFullscreen=document.fullScreen||document.mozFullScreen||document.webkitIsFullScreen;
		if(!isFullscreen){
		    // 判断各种浏览器，找到正确的方法
		     if(element.requestFullscreen) {
		      element.requestFullscreen();
		     } else if(element.mozRequestFullScreen) {
		      element.mozRequestFullScreen();
		     } else if(element.webkitRequestFullscreen) {
		      element.webkitRequestFullscreen();
		     } else if(element.msRequestFullscreen) {
		      element.msRequestFullscreen();
		     }
		}else{
			document.exitFullscreen?document.exitFullscreen():
			document.mozCancelFullScreen?document.mozCancelFullScreen():
			document.webkitExitFullscreen?document.webkitExitFullscreen():'';
		}
	}
		//threejs世界坐标转屏幕像素点,需要注意的是世界坐标的0点是屏幕的中心点
	this.changeWordToScreen=function (wx,wy){
		var wordWHValue = this.getWordWHValue();//世界坐标对应的长度和宽度			
		var x=(wx/wordWHValue.w)*(w/2)+w/2;
		var y=h/2-(wy/wordWHValue.h)*(h/2);
		
		return {x:x,y:y};
	}
	this.changeScreenToWord=function (sx,sy){
		var wordWHValue = this.getWordWHValue();//世界坐标对应的长度和宽度			
		
		var x=(sx/w)*(wordWHValue.w)*2-wordWHValue.w;
		var y=wordWHValue.h-(sy/h)*(wordWHValue.h)*2;
		
		return {x:x,y:y};
	}
		//获取世界坐标系长度（一半）和宽度(一半)对应的米数
	this.getWordWHValue=function (){
		var radian = (Math.PI/180)*(cameraPara.fov/2);
		var heightword=Math.tan(radian)*cameraPara.pz;
		//这里有将纵向的弧度根据纵横比算出横向弧度值
		var widthword=heightword*(w/h);								
		return {w:widthword,h:heightword};
	}
	//教师端和渲染端的分辨率是不一致的。将教师端全屏分辨率转换，渲染端指定分辨率下的坐标
	this.changeTeacherPtoToRenderp=function (tx,ty){
		var rx=(tx/window.innerWidth)*constraints.video.width;
		var ry=(ty/window.innerHeight)*constraints.video.height;

		return {x:rx,y:ry};
	}

	var INTERSECTED;
	this.getINTERSECTED=function(){

		return INTERSECTED;
	}
	//碰撞检测
	this.raycasterCheck=function (mouse){
		if(fadongji){
			raycasterCheck2( mouse, camera );
			return;
		}
			
		var id=-1;
		raycaster.setFromCamera( mouse, camera );
		var uuid="";
		var name="";
		var intersects = raycaster.intersectObjects( root.children ,true);
		if ( intersects.length > 0 ) {
			
			if ( INTERSECTED != intersects[ 0 ].object ) {
				if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				INTERSECTED = intersects[ 0 ].object;
				id=INTERSECTED.id;
				uuid=INTERSECTED.uuid;
				name=INTERSECTED.name;
				//	console.log('peizhuangla***************************'+id);
				//var id=intersects[ 0 ].object.id;
				//var mesh = root.getObjectById(id);//getObjectByName(name);
				//INTERSECTED=mesh;
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex( 0x00ffff );				
			}else//没有变化
				id=-1;
		} else{
			uuid=id=-2;
			name="";
			if ( INTERSECTED ) 
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex);
			INTERSECTED=null;
		}
		if(mode=="teacher"&&id!=-1){
			var json={
				event:"asynRaycaster",
				id:id,
				uuid:uuid,
				name:name,
			}								
			teacherDataChanger(json);
		}
	}
	var raycasterCheck2=function (mouse){
		if(!com3d)
			return;
		raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( com3d.children,true );
		if ( intersects.length > 0 ) {
				//console.log('peizhuangla***************************');
			if ( INTERSECTED != intersects[ 0 ].object ) {

				INTERSECTED = intersects[ 0 ].object;
				id=INTERSECTED.id;
				//var id=intersects[ 0 ].object.id;
				//var mesh = root.getObjectById(id);//getObjectByName(name);
				//INTERSECTED=mesh;
			//	console.log('***************************'+INTERSECTED.id);
				
			}
		} else{
			id=-2;	
			INTERSECTED=null;
		}

	}

  	var sphereMaterial=new THREE.MeshPhongMaterial({
		    color:0x00ffff,
		    specular:0x4488ee,
		    shininess:12
		});//材质对象

	this.asynRaycaster=function(json){
		if ( json.id > 0 ) {
			//var tempobj=root.getObjectById(json.id);
			//var tempobj=root.getObjectByProperty('uuid',json.uuid);//root.getObjectById(json.id);
			var tempobj=root.getObjectByName(json.name);
			if ( INTERSECTED != tempobj) {
				if ( INTERSECTED ) INTERSECTED.material=INTERSECTED.currentHex;//INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				INTERSECTED = tempobj;
	
				//INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				//INTERSECTED.material.emissive.setHex( 0x00ffff );
				if(INTERSECTED){
					INTERSECTED.currentHex =INTERSECTED.material;// global.tempactivity.material.emissive.getHex();
					INTERSECTED.material=sphereMaterial;//.emissive.setHex( 0x00ffff );
				}
			

				console.log('peizhuangla============================');
			}
		} else if ( json.id ==-2 ) {
	
			if ( INTERSECTED ) 
				INTERSECTED.material=INTERSECTED.currentHex;
			//	INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			INTERSECTED=null;
		}
	}
	this.isMobile= function (){
			if( navigator.userAgent.match(/Android/i)
				|| navigator.userAgent.match(/webOS/i)
				|| navigator.userAgent.match(/iPhone/i)
				|| navigator.userAgent.match(/iPad/i)
				|| navigator.userAgent.match(/iPod/i)
				|| navigator.userAgent.match(/BlackBerry/i)
				|| navigator.userAgent.match(/Windows Phone/i)
			)return true;
			return false;
		}
}