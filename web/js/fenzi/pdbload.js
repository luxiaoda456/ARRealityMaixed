//项root中加载pdb模型
const PDBload=function(l){
    var loader=l;

    this.loadMolecule= function ( url,teacherModeIndex ) {

      
     
      if(mode=="teacher"){
        var json={
          event:"loadMolecule",
          loadModeIndex:loadModeIndex,
          url:url,
        }
        teacherDataChanger(json);
      }else{
    
        loadModeIndex=teacherModeIndex;

      }
      while ( root.children.length > 0 ) {

        var object = root.children[ 0 ];
        object.parent.remove( object );

      }
      var desc=MOLECULESDesc[loadModeIndex];
        $("#menu2").html(desc);

        /**
        var geometry = new THREE.BoxBufferGeometry( 1, 1,0.001 );
var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
var cube = new THREE.Mesh( geometry, material );
cube.position.copy( new THREE.Vector3(3.84,0,0) );
scene.add( cube );**/

      loader.load( url, function ( pdb ) {

        var geometryAtoms = pdb.geometryAtoms;
        var geometryBonds = pdb.geometryBonds;
        var json = pdb.json;

        var boxGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
        var sphereGeometry = new THREE.IcosahedronBufferGeometry( 1, 2 );

        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate();

        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );

        var positions = geometryAtoms.getAttribute( 'position' );
        var colors = geometryAtoms.getAttribute( 'color' );

        var position = new THREE.Vector3();
        var color = new THREE.Color();
       // for ( var j = 0; j < pdb.count; j ++ ) {

       // }
        var s=0.5;
        for ( var i = 0; i < positions.count; i ++ ) {//增加元素和文本说明

          position.x = positions.getX( i );
          position.y = positions.getY( i );
          position.z = positions.getZ( i );
          var temp=0.7;
          color.r =colors.getX( i )-temp;
          color.g =colors.getY( i )-temp+0.1;
          color.b = colors.getZ( i )-temp;

          var material = new THREE.MeshPhongMaterial( { color: color } );

          var object = new THREE.Mesh( sphereGeometry, material );
          object.name="element"+i;
          object.position.copy( position );
          object.position.multiplyScalar( 0.7*s );//对elements所有元素分别*=s。看到这里相信你一定已经绕晕了，实践一下慢慢熟悉他们
          object.scale.multiplyScalar( 0.1*s);
          //mesh.scale.set(0.5,0.5,0.5);//缩小为原来0.5倍
          root.add( object );

          var atom = json.atoms[ i ];

          var text = document.createElement( 'div' );
          text.className = 'label';
          text.style.color = 'rgb(' + atom[ 3 ][ 0 ] + ',' + atom[ 3 ][ 1 ] + ',' + atom[ 3 ][ 2 ] + ')';
          text.textContent = atom[ 4 ];

          var label = new THREE.CSS2DObject( text );
          label.position.copy( object.position );
          root.add( label );

        }

        positions = geometryBonds.getAttribute( 'position' );

        var start = new THREE.Vector3();
        var end = new THREE.Vector3();

        for ( var i = 0; i < positions.count; i += 2 ) {//增加连接线

          start.x = positions.getX( i );
          start.y = positions.getY( i );
          start.z = positions.getZ( i );

          end.x = positions.getX( i + 1 );
          end.y = positions.getY( i + 1 );
          end.z = positions.getZ( i + 1 );

          start.multiplyScalar( 0.7*s );
          end.multiplyScalar( 0.7 *s);

          color.r =colors.getX( i );
          color.g =colors.getY( i );
          color.b = colors.getZ( i );
          var material = new THREE.MeshPhongMaterial( { color: 0x333333 } );
          var object = new THREE.Mesh( boxGeometry, material );
          object.name="elementline"+i;
          object.position.copy( start );
          object.position.lerp( end, 0.5 );
          object.scale.set( 0.06*s, 0.06*s, start.distanceTo( end ) );

          object.lookAt( end );
          root.add( object );

        }
      } );

    }     
}