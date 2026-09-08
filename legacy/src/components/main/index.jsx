import React, { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import EarthNewClouds from "../../assets/textures/clouds.jpg";
import EarthSpecularMap from "../../assets/textures/8k_earth_specular_map.jpg";
import EarthNewMap from "../../assets/textures/earth.jpg";
import { TextureLoader } from "three";

export function Earth(props) {
  const [colorMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    EarthNewMap,
    EarthSpecularMap,
    EarthNewClouds,
  ]);

  const earthRef = useRef();
  const cloudsRef = useRef();

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();

    earthRef.current.rotation.y = elapsedTime / 7;
    cloudsRef.current.rotation.y = elapsedTime / 7;
  });

  return (
    <>
      {/* <ambientLight intensity={1} /> */}
      <pointLight color="#f6f3ea" position={[2, 0, 5]} intensity={1.2} />
      <Stars
        radius={300}
        depth={60}
        count={5000}
        factor={7}
        saturation={0}
        fade={true}
      />
      <mesh ref={cloudsRef} position={[0, 0, 3]}>
        <sphereGeometry args={[1.005, 32, 32]} />
        <meshPhongMaterial
          map={cloudsMap}
          opacity={0.4}
          depthWrite={true}
          transparent={true}
          // side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={earthRef} position={[0, 0, 3]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial specularMap={specularMap} />
        <meshStandardMaterial map={colorMap} metalness={0.4} roughness={0.7} />
      </mesh>
    </>
  );
}
