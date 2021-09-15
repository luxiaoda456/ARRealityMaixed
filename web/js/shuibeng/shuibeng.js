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
	
			if(cameraPara.ground)
				myself.addGroundGrid();
			camera.updateProjectionMatrix();



			addEventListeners();
			animate();
			add3dCom();
		}

	var grid=null ;
		this.addGroundGrid =function(){
			if(grid)
				return;
			grid = new THREE.GridHelper( 10, 40, 0x000000, 0x000000 );
			grid.material.opacity = 0.4;
			grid.material.transparent = true;
			scene.add( grid );

			camera.aspect = w/ h;

			var geometry = new THREE.SphereGeometry( .005, 16, 16 );
			var material = new THREE.MeshBasicMaterial( {color: 0xff3300} );
			sphere = new THREE.Mesh( geometry, material );
			scene.add( sphere );
		}

		this.removeGroundGrid=function(){
			if(grid)
				scene.remove(grid);
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
				//new THREE.Vector3();

			//common.loadFbxModel('models/fbx/fadongji6.fbx',p,0.3,com3d,false);//缩放后桌子尺寸1.56*1.07*0.91
/****/
			new THREE.ObjectLoader ().load( 'models/json/pump/pump.json', function ( model ) {
				var s=0.007;
				model.scale.set(s,s,s);
				com3d.add( model );
				var p=new THREE.Vector3();p.x=0;p.y=0.4;p.z=0;
				model.position.copy( p );	
				mixer = new THREE.AnimationMixer( model );
				mixer.clipAction( model.animations[ 0 ] ).play();

			//	animate();

			} );
			
					//地球
		/**	var loader2 = new THREE.TextureLoader();
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
			**/
			//var p2=new THREE.Vector3();p2.x=1;p2.y=0;p2.z=-1.3;	//new THREE.Vector3();
			//common.loadFbxModel('models/fbx/shafa/shafa.fbx',p2,1,com3d,false);
			//common.loadFbxModel('models/fbx/dancer/aj.fbx',p2,0.015,com3d,true);

			var position2 = new THREE.Vector3();position2.x=-0.5;position2.y=1.65;position2.z=0.4;	
			common.loadFbxModel('models/fbx/tuzi/tz.FBX',position2,0.03,com3d,false);
			//var position3 = new THREE.Vector3();position3.x=0.1;	position3.z=0.2;	position3.y=1.79;
			//common.loadFbxModel('models/fbx/book/TEST2.fbx',position3,0.009,com3d,false);
			//地球
	
		
			var position4 = new THREE.Vector3();	position4.x=0;	position4.z=0;	position4.y=0;
			com3d.position.copy( position4 );		
			com3d.rotation.y=1.57;
			//com3d.scale.set(1,1,1);	
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

	  		if(global.tempactivity){
				if(global.tempactivity.material)//还原老纹理
					global.tempactivity.material=global.tempactivity.currentHex;
			}
	  	}
	  	this.transformChildChange=function(data){
	  		var tempobj=com3d.getObjectByProperty('uuid',data.uuid);//com3d.getObjectByName(data.targetName);//getObjectById(data.targetID);
	  		if(tempobj.position)
	  			tempobj.position.copy(data.position);


			if(global.tempactivity){
				if(global.tempactivity.material)//还原老纹理
					global.tempactivity.material=global.tempactivity.currentHex;
			}
			global.tempactivity=tempobj;// INTERSECTED;
		
			global.tempactivity.currentHex =global.tempactivity.material;// global.tempactivity.material.emissive.getHex();
			global.tempactivity.material=sphereMaterial;//.emissive.setHex( 0x00ffff );




	  		tempobj.rotation.copy(data.rotation);
	  		tempobj.scale.set(data.scale.x,data.scale.y,data.scale.z);
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
		
			if(mixer&&rootParam.animalShuiBeng){
				mixer.update( clock.getDelta() );	
			
			}
	
			common.render();
		}	

		//root参数		,animal 表示是否自动旋转
		var rootParam={animal:true,scale:0.5,px:-2.5,py:0.5,animalShuiBeng:false};
		//上一步
		this.preStep=function(){
			setRootTransform(-2.5,0.5,0,0,0,0,1);
      		rootParam.scale=0.5;
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
      		setRootTransform(0,2.0,0,0,0,0,1);
      		rootParam.scale=1;
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
		var istransform=false;
	

		//教室端点击transform按钮
	  	const transform=function (event){
	  		if(global.tempactivity){
				if(global.tempactivity.material)//还原老纹理
					global.tempactivity.material=global.tempactivity.currentHex;
				global.tempactivity=null;
			}
	  	
			if(istransform){
				controls.detach(com3d) //解除对象
				istransform=false;
	
	      	}
	      	else if(controls){
				controls.attach( com3d );
				istransform=true;
				if(event){
					switch ( event.mode ) {
						case "p": // W						
							controls.setMode( "translate" );
							break;
						case "r": // E
							controls.setMode( "rotate" );
							break;
						case "s": // R
							controls.setMode( "scale" );
							break
					}
				}
	      	}
	  	}; 	
     	var sphereMaterial=new THREE.MeshPhongMaterial({
					    color:0x00ffff,
					    specular:0x4488ee,
					    shininess:12
					});//材质对象
		function onMouseDown(event){
			mousedown=true;

			if(istransform==false){
				var active=common.getINTERSECTED();
				if(active&&global.tempactivity!=active){
					if(global.tempactivity){
						controls.detach(global.tempactivity) //解除对象

						if(global.tempactivity.material)//还原老纹理
							global.tempactivity.material=global.tempactivity.currentHex;
					}

					global.tempactivity=common.getINTERSECTED();// INTERSECTED;
					controls.attach( global.tempactivity );
					controls.setMode( "translate" );
					//global.tempactivity.material.color.set( 0x00ffff );
				
					global.tempactivity.currentHex =global.tempactivity.material;// global.tempactivity.material.emissive.getHex();
					global.tempactivity.material=sphereMaterial;//.emissive.setHex( 0x00ffff );
			
					
		      	}
			}
			//$("#menu2").html("onMouseDown ");
		}
		function onMouseUp(event){
			mousedown=false;
			if(global.tempactivity){
					var s=1;
				//	global.tempactivity.scale.set(s,s,s);
				//global.tempactivity.material.color.set( 0x000000 );
				//if(global.tempactivity.material)
				//		global.tempactivity.material=global.tempactivity.currentHex;
					//global.tempactivity.material.emissive.setHex( global.tempactivity.currentHex  );
			}
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

				if(istransform==false){
					var active=common.getINTERSECTED();
					if(active&&global.tempactivity!=active){
						if(global.tempactivity)
							controls.detach(global.tempactivity) //解除对象
						global.tempactivity=common.getINTERSECTED();// INTERSECTED;
						controls.attach( global.tempactivity );
						controls.setMode( "translate" );
			      	}
				}
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
		  	$("#transformp").click(function(event) {
		  		var e={mode:"p"};
		      	transform(e);
		  	});	
		  	$("#transformr").click(function(event) {
		      	var e={mode:"r"};
		      	transform(e);
		  	});	
		  	$("#transforms").click(function(event) {
		      	var e={mode:"s"};
		      	transform(e);
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

		  	$("#animalBt").click(function(){
		  		rootParam.animalShuiBeng=!rootParam.animalShuiBeng;
		  		if(mode=="teacher"){//将root的transform传递给渲染端
	       			var json={
						event:"animalShuiBeng",
						animalShuiBeng:rootParam.animalShuiBeng,			
					}
					teacherDataChanger(json);
				}
		 
	        });
	        

	 	}
	 	this.animalShuiBeng=function(an){

	        	rootParam.animalShuiBeng=an;
	        }

}