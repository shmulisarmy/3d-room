import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3, type Camera } from "three";
import { ROOM_DIMENSIONS } from "@/lib/items";

const eyeHeight = 1.6;
const roomPadding = 0.42;
const walkSpeed = 2.2;

interface PlayerProps {
  lookEnabled: boolean;
  resetSignal: number;
}

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

const isOverlayTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest(".panel, .detail-panel, .minimap, .item-tooltip"));

const applyLookDirection = (camera: Camera, yaw: number, pitch: number, target: Vector3) => {
  target.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(camera.position.x + target.x, camera.position.y + target.y, camera.position.z + target.z);
};

export const Player = ({ lookEnabled, resetSignal }: PlayerProps) => {
  const { camera, gl } = useThree();
  const pressedKeys = useRef<Set<string>>(new Set());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());

  useEffect(() => {
    pressedKeys.current.clear();
    yaw.current = 0;
    pitch.current = 0;
    camera.position.set(0, eyeHeight, 0);
    applyLookDirection(camera, yaw.current, pitch.current, lookTarget.current);
  }, [camera, resetSignal]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = lookEnabled ? "crosshair" : "";

    const handleMouseMove = (event: MouseEvent) => {
      if (!lookEnabled || isOverlayTarget(event.target)) {
        return;
      }

      yaw.current -= event.movementX * 0.003;
      pitch.current = MathUtils.clamp(pitch.current - event.movementY * 0.003, -0.9, 0.9);
      applyLookDirection(camera, yaw.current, pitch.current, lookTarget.current);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [camera, gl, lookEnabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryTarget(event.target)) {
        return;
      }

      if (["KeyW", "KeyA", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
        pressedKeys.current.add(event.code);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeys.current.clear();
    };
  }, []);

  useFrame((_, delta) => {
    const keys = pressedKeys.current;
    const moveForward = keys.has("KeyW") || keys.has("ArrowUp");
    const moveBack = keys.has("ArrowDown");
    const moveLeft = keys.has("KeyA") || keys.has("ArrowLeft");
    const moveRight = keys.has("KeyD") || keys.has("ArrowRight");

    movement.current.set(0, 0, 0);

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    if (moveForward) {
      movement.current.add(forward.current);
    }

    if (moveBack) {
      movement.current.sub(forward.current);
    }

    if (moveRight) {
      movement.current.add(right.current);
    }

    if (moveLeft) {
      movement.current.sub(right.current);
    }

    if (movement.current.lengthSq() > 0) {
      movement.current.normalize().multiplyScalar(walkSpeed * delta);
      camera.position.add(movement.current);
    }

    camera.position.x = MathUtils.clamp(camera.position.x, -ROOM_DIMENSIONS.width / 2 + roomPadding, ROOM_DIMENSIONS.width / 2 - roomPadding);
    camera.position.z = MathUtils.clamp(camera.position.z, -ROOM_DIMENSIONS.depth / 2 + roomPadding, ROOM_DIMENSIONS.depth / 2 - roomPadding);
    camera.position.y = eyeHeight;
  });

  return null;
};
