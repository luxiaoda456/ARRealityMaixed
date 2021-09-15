const FenZi=function(){

	var myself=this;
	this.init=function () {

			if(mode=="server"){
				$("#menu").hide();
				//$("#video").style='position: absolute;width: '+constraints.video.width+'px;height: '+constraints.video.height+'px;';
				//$("#video").style.cssText="position: absolute;";
				var v=$("#video");
				$("#video").css("position","absolute");
				$("#video").css("width",constraints.video.width);
				$("#video").css("height",constraints.video.height);
				$("#beforeLayer").css("width",constraints.video.width);
				$("#beforeLayer").css("height",constraints.video.height);			
			}else{
				$("#video").hide();		
				//w=window.innerWidth
			 	//h=window.innerHeight		
			}
			common=new Common();
			common.initThreeJSContent();//初始化threejs环境
			if(window.location.pathname.indexOf("fenzi.html")>-1){
	    
				//return;
				pdbload=new PDBload(loader);
				pdbload.loadMolecule( 'models/molecules/ethanol.pdb' );
			}

	

			//GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color ) 参数说明
			//size -- 网格宽度，默认为 10米. //
			//divisions -- 等分数，默认为 10. 
			//colorCenterLine -- 中心线颜色，默认 0x444444 
			//colorGrid --  网格线颜色，默认为 0x888888
			if(cameraPara.ground)
				myself.addGroundGrid();
		
			//renderer.setSize( w, h );
			//labelRenderer.setSize( w, h );


			camera.aspect = w/ h;
			camera.updateProjectionMatrix();
			//renderer.render(scene, tempcamera);

			addEventListeners();
			animate();
		}
		var grid=null ;
		var sphere=null;
		this.addGroundGrid =function(){
			if(grid)
				return;
			grid = new THREE.GridHelper( 10, 40, 0x000000, 0x000000 );
			grid.material.opacity = 0.4;
			grid.material.transparent = true;
			scene.add( grid );


			var grid2 = new THREE.GridHelper( 10, 40, 0xff0000, 0xff0000 );
			grid2.material.opacity = 0.8;
			grid2.material.transparent = true;
			grid2.rotation.x = -1.57;
			var position4 = new THREE.Vector3();	position4.x=0;		position4.y=5;position4.z=-0.25;
			grid2.position.copy( position4 );	
			scene.add( grid2 );



			var geometry = new THREE.SphereGeometry( .005, 16, 16 );
			var material = new THREE.MeshBasicMaterial( {color: 0xff3300} );
			sphere = new THREE.Mesh( geometry, material );
			scene.add( sphere );

		
		}

		this.removeGroundGrid=function(){
			if(grid)
				scene.remove(grid);
			if(sphere)
				scene.remove(sphere);
			geometry=null;
			grid=null;
		}
		//添加3d组件,课桌地球兔子和书
		function add3dCom(){
			controls=new ComTransformControl(scene);
			controls.addControl();
			com3d = new THREE.Group();
			scene.add( com3d );	
			//
			//loader3.load('models/fbx/tree/tree.fbx', function ( object ) {
			////桌子模型模式伸缩比是2.54 伸缩后尺寸：长度：304.8 高度：209.5,深度177.8，不缩放尺寸为120*82.5*70
			var p=new THREE.Vector3();p.x=0;p.y=0;p.z=0;	//new THREE.Vector3();
			var p2=new THREE.Vector3();p2.x=-0.37;p2.y=1.07;p2.z=0.3;	//new THREE.Vector3();
			common.loadFbxModel('models/fbx/yuhangyuan/suit2.fbx',p2,0.00008,com3d,true);//缩放后桌子尺寸1.56*1.07*0.91
			common.loadFbxModel('models/fbx/desk/kezuo.fbx',p,(0.0088),com3d,false);//缩放后桌子高度0.7258(由于标定版还有5毫秒再加5毫秒正好是桌子的高度0.73米)
			//var p2=new THREE.Vector3();p2.x=1;p2.y=0;p2.z=0;	//new THREE.Vector3();
			//common.loadFbxModel('models/fbx/shafa/shafa.fbx',p2,1,com3d,false);
			//common.loadFbxModel('models/fbx/dancer/aj.fbx',p2,0.008,com3d,true);

			var p2=new THREE.Vector3();p2.x=0.3;p2.y=0.73;p2.z=0;	//new THREE.Vector3();

			//common.loadFbxModel('models/fbx/dancer/aj.fbx',p2,0.0015,com3d,true);
			
			//var position2 = new THREE.Vector3();position2.x=-0.5;position2.y=1.65;position2.z=0.4;	
			//common.loadFbxModel('models/fbx/tuzi/tz.FBX',position2,0.03,com3d,false);
			//var position3 = new THREE.Vector3();position3.x=0.1;	position3.z=0.2;	position3.y=1.79;
			//common.loadFbxModel('models/fbx/book/TEST2.fbx',position3,0.009,com3d,false);
			//
			
			//createFloor();
			//地球
			var loader2 = new THREE.TextureLoader();
				loader2.load( 'assets/textures/land_ocean_ice_cloud_2048.jpg', function ( texture ) {
				var geometry = new THREE.SphereGeometry( 0.13, 20, 20 );
				var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
				var mesh = new THREE.Mesh( geometry, material );
				var position = new THREE.Vector3();position.x=-0.4;position.y=0.86;position.z=0
				//var position = new THREE.Vector3();position.x=0;position.y=0;position.z=0
				//var position = new THREE.Vector3();position.x=0;position.z=0;position.y=0.2;
				mesh.position.copy( position );
				earth=mesh;
				//mesh.id=1;
				com3d.add( mesh );		


			} );
		
			var position4 = new THREE.Vector3();	position4.x=0.5;	position4.z=0;	position4.y=0;
			com3d.position.copy( position4 );		
			com3d.scale.set(1,1,1);	
			//com3d.scale=2;
		}
		   //创建地板
        function createFloor(){
       		var geometry = new THREE.BoxBufferGeometry( 3, 0.01, 1);
			var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
			material.opacity = 0.2;
			material.transparent = true;
			var cube = new THREE.Mesh( geometry, material );
			com3d.add( cube );


	
        }

		//渲染服务器处理碰撞检测后的数据
		this.asynRaycaster=function(json){
			common.asynRaycaster(json);
		}
	  	//添加或删除课桌
	  	this.desk=function (event){
			if(controls&&controls.getControlAttack())//
				controls.detach(com3d) //解除对象
	      	if(com3d){		 
				scene.remove(com3d);
				com3d=null;
			}else
				add3dCom();
	  	};
	  	//渲染服务器处理root变换
		this.transformRootChange=function(json){
			if(mode=="teacher")
				return;
			var screenpoint= common.changeWordToScreen(json.position.x,json.position.y);
			if(screenpoint.x<100||screenpoint.y>620){
				var word =common.changeScreenToWord(100,620);
				json.position.x=word.x;
				json.position.y=word.y;
			}
      		setRootTransform(json.position.x,json.position.y,0,json.rotation._x,json.rotation._y,0,1);
			root.scale.set(json.scale,json.scale,json.scale);	
		}
	  	//渲染服务端处理课桌变换 
	  	this.transformChange=function (data){
	  		if(com3d.position)
	  			com3d.position.copy(data.position);
	  		com3d.rotation.copy(data.rotation);
	  		com3d.scale.set(data.scale.x,data.scale.y,data.scale.z);
	  	}
	  	
		//窗口大小改变，教师端需要调整画布大小
		function onWindowResize() {
			if(mode=="teacher"){
				//w = window.innerWidth ;
				//h = window.innerHeight ;
			}
			camera.aspect = w/ h;
			camera.updateProjectionMatrix();

			renderer.setSize( w, h );
			labelRenderer.setSize( w, h );

		}
		//动画帧处理函数
		function animate() {//teacher 缩小状态下旋转			
			requestAnimationFrame( animate );
			if(TWEEN)
				TWEEN.update();
			if(earth)//转动地球
				earth.rotation.y -= 0.005;
			if(mixer){
			//if(mixer&&!rootParam.animal){
				mixer.update( clock.getDelta() );	
			}
			if(!rootParam.animal){
				common.render();
				return;
			}
			if(mode=="teacher"){//将root的transform传递给渲染端
				var time = Date.now() * 0.0004;						
				setRootTransform(rootParam.px,rootParam.py,0,time,time * 0.7,0,1);
				myself.setRootScale(rootParam.scale);
				var rp=common.changeTeacherPtoToRenderp(root.position.x,root.position.y);
				var json={
					event:"transform",
					rotation:root.rotation,
					position:{x:rp.x,y:rp.y},
					scale:rootParam.scale
				}
				//debugger;
				teacherDataChanger(json);
			}else if(mode=="server"){
			
			}
			common.render();
		}			
		//root参数		,animal 表示是否自动旋转
		var rootParam={animal:true,scale:0.1,px:-0.5,py:0.3};
		//上一步
		this.preStep=function(){
			setRootTransform(-0.5,0.3,0,0,0,0,1);
      		rootParam.scale=0.1;
            myself.setRootScale(rootParam.scale);
           	rootParam.animal=true;
           	if(mode=="teacher"){
           		var json={
				event:"preStep",
				rotation:root.rotation,
				position:{x:root.position.x,y:root.position.y},
				scale:rootParam.scale
				}
				teacherDataChanger(json);
           	}
        };
        //下一步
        this.nextStep=function(){
      		setRootTransform(0,0.5,1,0,0,0,0,1);
      		rootParam.scale=0.5;
      		myself.setRootScale(rootParam.scale);
           	rootParam.animal=false;       
           	if(mode=="teacher"){
           		var json={
				event:"nextStep",
				rotation:root.rotation,
				position:{x:root.position.x,y:root.position.y},
				scale:rootParam.scale
				}
				teacherDataChanger(json);
           	}     
        };
        const setRootTransform=function(x,y,z,rx,ry,rz,rw){
        	rootParam.px=x;
         	rootParam.py=y;
        	root.position.x=x;
           	root.position.y=y;
           	root.rotation.x = rx;
		 	root.rotation.y = ry;
        }
       	this.setRootScale=function(myscale){
        	rootParam.scale=myscale;
        	root.scale.set(myscale,myscale,myscale);   
        }
        this.loadMolecule= function ( url,teacherModeIndex ) {
			pdbload.loadMolecule(url,teacherModeIndex);  
		}
		var tempactivity;
		//教室端点击transform按钮
	  	const transform=function (event){
			if(controls&&controls.getControlAttack()){
				controls.detach(com3d) //解除对象
				//controls.detach(tempactivity) //解除对象
	      	}
	      	else if(controls){
				controls.attach( com3d );
				//tempactivity=INTERSECTED;
				//controls.attach( tempactivity );
				
	      	}
	  	}; 	
     
		function onMouseDown(event){
			mousedown=true;



			if(false){

					var active=common.getINTERSECTED();
					if(active&&tempactivity!=active){
						if(tempactivity)
							controls.detach(tempactivity) //解除对象
						tempactivity=common.getINTERSECTED();// INTERSECTED;
						controls.attach( tempactivity );
			      	}
			   }
	

			//$("#menu2").html("onMouseDown ");
		}
		function onMouseUp(event){
			mousedown=false;
		}
        function onDocumentMouseMove( event ) {
			event.preventDefault();
			var x =  event.clientX;
			var y = event.clientY;
			changeRootRotationByMouse(x,y);
			//$("#menu2").html("mousemove x:"+x+",y:"+y);
		}
        function onDocumentTouchStart(event) {
			if (event.touches.length === 1) {
				console.log('onDocumentTouchStart 》》》》》');
				mousedown=false;
				var touch2 = event.touches[0];
				var x=event.touches[0].pageX ;
				var y=event.touches[0].pageY ;
				changeRootRotationByMouse(x,y);				
				//$("#menu2").html("window.innerWidth :"+window.innerWidth+",window.innerHeight:"+window.innerHeight+"Math.tan(--):"+Math.tan(radian));
			}

		}
		function onDocumentTouchMove(event) {
			if (event.touches.length === 1) {
				event.preventDefault();
				console.log('onDocumentTouchMove.');
				var x=event.touches[0].pageX ;
				var y=event.touches[0].pageY ;
				changeRootRotationByMouse(x,y);
				mousedown=true;
				//$("#menu2").html("TouchMove x:"+x+",y:"+y);
			}else{
				mousedown=false;
			}
		}
		//鼠标控制root旋转
		const changeRootRotationByMouse=function(x,y){
			var mouse = new THREE.Vector2();
			mouse.x = ( x/ w ) * 2 - 1;
			mouse.y = - (y/ h) * 2 + 1;		
			common.raycasterCheck(mouse);					
			if(rootParam.animal==false&&mousedown==true){				
				var ry = ( x/w ) * 4 - 1;
				var rx = - (y/ h ) * 4 + 1;
				setRootTransform(rootParam.px,rootParam.py,0,rx,ry,0,1);
				myself.setRootScale(rootParam.scale);
				var rp=common.changeTeacherPtoToRenderp(root.position.x,root.position.y);
				if(mode=="teacher"){
					var json={
						event:"transform",
						rotation:root.rotation,
						position:{x:rp.x,y:rp.y},
						mousex:x,
						mousey:y,
						scale:rootParam.scale
					}								
					teacherDataChanger(json);
				}
			}
		}
		//添加事件监听
		function addEventListeners(){
			window.addEventListener( 'resize', onWindowResize, false );
			if(mode=="teacher"){//教室端需要操作需要监听鼠标或点击事件		
				window.addEventListener('touchstart', onDocumentTouchStart, false);
				window.addEventListener('touchmove', onDocumentTouchMove, false);
				if(!common.isMobile()){//pc
					window.addEventListener('mousedown',onMouseDown,false);
			        window.addEventListener('mouseup',onMouseUp,false);  
			        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		    	}
		    }
			//监听鼠标点击进行全屏操作
			//window.addEventListener('mousedown',function(event) {
			$("#fullScreen").click(function(event) {
		      	common.fullScreen(localVideo); 
		  	});
		  	var com3dvisble=false;
		  	//点击讲台，添加或删除讲台
		  	$("#desk").click(function(event) {
				desk(event);
       			var json={
					event:"desk",
				}
				teacherDataChanger(json);
		  	});		 
		  	//点击变换添加或删除变换
		  	$("#transform").click(function(event) {
		      	transform(event);
		  	});	
		  	$("#preChapter").click(function(){
	  			if(loadModeIndex==0)
	  				loadModeIndex=4
	  			else
	  				loadModeIndex=loadModeIndex-1;
	  			var name=MOLECULESName[loadModeIndex];
       			pdbload.loadMolecule('models/molecules/'+name );       	
	        });
	        $("#nextChapter").click(function(){
	        	if(loadModeIndex==4)
	  					loadModeIndex=0
	  				else
	  					loadModeIndex=loadModeIndex+1;
	         	var name=MOLECULESName[loadModeIndex];
	       		pdbload.loadMolecule( 'models/molecules/'+name );
	       		
	        });
	        $("#preStep").click(myself.preStep);
	        $("#nextStep").click(myself.nextStep);

		  	$("#big").click(function(){
		  		rootParam.scale=rootParam.scale+0.01;
		  		myself.setRootScale(rootParam.scale);
				if(mode=="teacher"){
					var json={
						event:"changescale",			
						scale:rootParam.scale
					}								
					teacherDataChanger(json);
				}
	        });

		  	$("#litter").click(function(){
		 		rootParam.scale=rootParam.scale-0.01;
	       		myself.setRootScale(rootParam.scale);
				if(mode=="teacher"){
					var json={
						event:"changescale",			
						scale:rootParam.scale
					}								
					teacherDataChanger(json);
				}
	        });
	 	}

}