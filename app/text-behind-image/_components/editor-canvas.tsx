"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import FilteredImage from "./filtered-image";
import { Image as KonvaImage, Layer, Stage, Text, Transformer } from "react-konva";
import { useEditorStore } from "../_lib/editor-store";
import type { ImageLayer, LayerKind, TextLayer } from "../_lib/editor-types";

const MAX_EXPORT_PIXELS = 32_000_000;
export type EditorCanvasExporter = () => string;
interface EditorCanvasProps {
  foregroundUrl: string | null;
  originalUrl: string;
  onExportReady: (exporter: EditorCanvasExporter | null) => void;
}

function useCanvasImage(source: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!source) { setImage(null); return; }
    let active = true;
    const nextImage = new window.Image();
    nextImage.decoding = "async";
    nextImage.onload = () => { if (active) setImage(nextImage); };
    nextImage.src = source;
    return () => { active = false; };
  }, [source]);
  return image;
}

const normalizedPosition = (node: Konva.Node, stageWidth: number, stageHeight: number) => ({
  left: (node.x() / stageWidth) * 100 - 50,
  top: 50 - (node.y() / stageHeight) * 100,
});

interface TextLayerNodeProps { isSelected: boolean; layer: TextLayer; stageHeight: number; stageWidth: number; outline?: boolean; passive?: boolean; }
function TextLayerNode({ isSelected, layer, stageHeight, stageWidth, outline=false, passive=false }: TextLayerNodeProps) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const updateTextLayer = useEditorStore((state) => state.updateTextLayer);
  const bringLayerToFront = useEditorStore((state) => state.bringLayerToFront);
  useEffect(() => { const node=textRef.current;if(!node)return;node.offsetX(node.width()/2);node.offsetY(node.height()/2); }, [layer.fontFamily,layer.fontSize,layer.fontWeight,layer.text,stageWidth]);
  useEffect(() => { if(!isSelected||!textRef.current||!transformerRef.current)return;transformerRef.current.nodes([textRef.current]);transformerRef.current.getLayer()?.batchDraw(); }, [isSelected]);
  const select=()=>selectLayer({kind:"text",id:layer.id});
  const bringForward=()=>bringLayerToFront("text",layer.id);
  return <><Text ref={textRef} hitFunc={(context,shape)=>{context.beginPath();context.rect(0,0,shape.width(),shape.height());context.closePath();context.setAttr("fillStyle",shape.colorKey);context.fill();}} draggable={!passive} listening={!passive} fillEnabled={!outline} stroke={outline?layer.color:undefined} strokeWidth={outline?(layer.outlineWidth??2)*stageWidth/1000:0} fill={layer.color} fontFamily={layer.fontFamily} fontSize={(layer.fontSize*stageWidth)/1000} fontStyle={String(layer.fontWeight)} opacity={layer.opacity} rotation={layer.rotation} shadowBlur={(layer.shadowSize*stageWidth)/1000} shadowColor={layer.shadowColor} shadowEnabled={!outline&&layer.shadowSize>0} text={layer.text} x={(stageWidth*(layer.left+50))/100} y={(stageHeight*(50-layer.top))/100} onClick={select} onTap={select} onDblClick={bringForward} onDblTap={bringForward} onDragMove={outline?(event)=>updateTextLayer(layer.id,normalizedPosition(event.target,stageWidth,stageHeight)):undefined} onDragEnd={(event)=>updateTextLayer(layer.id,normalizedPosition(event.target,stageWidth,stageHeight))} onTransform={outline?()=>{const node=textRef.current;if(!node)return;const scale=Math.max(Math.abs(node.scaleX()),Math.abs(node.scaleY()));node.scale({x:1,y:1});updateTextLayer(layer.id,{...normalizedPosition(node,stageWidth,stageHeight),fontSize:Math.max(10,layer.fontSize*scale),rotation:node.rotation()})}:undefined} onTransformEnd={()=>{const node=textRef.current;if(!node)return;const scale=Math.max(Math.abs(node.scaleX()),Math.abs(node.scaleY()));node.scaleX(1);node.scaleY(1);updateTextLayer(layer.id,{...normalizedPosition(node,stageWidth,stageHeight),fontSize:Math.max(10,Math.round(layer.fontSize*scale)),rotation:Math.round(node.rotation())})}}/>
    {isSelected?<SelectionTransformer transformerRef={transformerRef}/>:null}</>;
}

interface ImageLayerNodeProps { isSelected:boolean; layer:ImageLayer; stageHeight:number; stageWidth:number; }
function ImageLayerNode({isSelected,layer,stageHeight,stageWidth}:ImageLayerNodeProps){
  const image=useCanvasImage(layer.src);
  const imageRef=useRef<Konva.Image>(null);
  const transformerRef=useRef<Konva.Transformer>(null);
  const selectLayer=useEditorStore((state)=>state.selectLayer);
  const updateImageLayer=useEditorStore((state)=>state.updateImageLayer);
  const bringLayerToFront=useEditorStore((state)=>state.bringLayerToFront);
  useEffect(()=>{if(!isSelected||!imageRef.current||!transformerRef.current)return;transformerRef.current.nodes([imageRef.current]);transformerRef.current.getLayer()?.batchDraw()},[isSelected,image]);
  if(!image)return null;
  const width=(stageWidth*layer.width)/100;
  const height=width*(image.naturalHeight/image.naturalWidth);
  const select=()=>selectLayer({kind:"image",id:layer.id});
  const bringForward=()=>bringLayerToFront("image",layer.id);
  return <><KonvaImage ref={imageRef} image={image} draggable opacity={layer.opacity} rotation={layer.rotation} width={width} height={height} offsetX={width/2} offsetY={height/2} x={(stageWidth*(layer.left+50))/100} y={(stageHeight*(50-layer.top))/100} onClick={select} onTap={select} onDblClick={bringForward} onDblTap={bringForward} onDragEnd={(event)=>updateImageLayer(layer.id,normalizedPosition(event.target,stageWidth,stageHeight))} onTransformEnd={()=>{const node=imageRef.current;if(!node)return;const scaledWidth=Math.abs(node.width()*node.scaleX());node.scaleX(1);node.scaleY(1);updateImageLayer(layer.id,{...normalizedPosition(node,stageWidth,stageHeight),width:Math.max(4,Math.min(150,(scaledWidth/stageWidth)*100)),rotation:Math.round(node.rotation())})}}/>
    {isSelected?<SelectionTransformer transformerRef={transformerRef}/>:null}</>;
}

function SelectionTransformer({transformerRef}:{transformerRef:React.RefObject<Konva.Transformer>}){return <Transformer ref={transformerRef} name="selection-controls" anchorCornerRadius={8} anchorFill="#fff" anchorSize={14} anchorStroke="#7557ff" borderStroke="#7557ff" enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]} flipEnabled={false} keepRatio rotateAnchorOffset={28}/>}

export default function EditorCanvas({foregroundUrl,originalUrl,onExportReady}:EditorCanvasProps){
  const containerRef=useRef<HTMLDivElement>(null);
  const stageRef=useRef<Konva.Stage>(null);
  const [viewport,setViewport]=useState({width:0,height:0});
  const originalImage=useCanvasImage(originalUrl);
  const foregroundImage=useCanvasImage(foregroundUrl);
  const selectedLayer=useEditorStore((state)=>state.selectedLayer);
  const selectLayer=useEditorStore((state)=>state.selectLayer);
  const textLayers=useEditorStore((state)=>state.textLayers);
  const imageLayers=useEditorStore((state)=>state.imageLayers);
  const effects=useEditorStore(state=>state.effects);
  useEffect(()=>{const container=containerRef.current;if(!container)return;const update=()=>setViewport({width:Math.floor(container.clientWidth),height:Math.floor(container.clientHeight)});update();const observer=new ResizeObserver(update);observer.observe(container);return()=>observer.disconnect()},[]);
  const aspectRatio=originalImage?originalImage.naturalHeight/originalImage.naturalWidth:1;
  const stageWidth=viewport.width>0&&viewport.height>0?Math.floor(Math.min(viewport.width,viewport.height/aspectRatio)):0;
  const stageHeight=stageWidth*aspectRatio;
  const exportPng=useCallback(()=>{const stage=stageRef.current;if(!stage||!originalImage||(foregroundUrl&&!foregroundImage)||stage.width()<=0||stage.height()<=0)throw new Error("The editor canvas is not ready yet.");const controls=stage.find(".selection-controls");controls.forEach(node=>node.hide());stage.draw();const sourceRatio=Math.min(originalImage.naturalWidth/stage.width(),originalImage.naturalHeight/stage.height());const safeRatio=Math.sqrt(MAX_EXPORT_PIXELS/(stage.width()*stage.height()));const pixelRatio=Math.max(.1,Math.min(sourceRatio,safeRatio));try{return stage.toDataURL({mimeType:"image/png",pixelRatio,imageSmoothingEnabled:true})}finally{controls.forEach(node=>node.show());stage.draw()}},[foregroundImage,foregroundUrl,originalImage]);
  useEffect(()=>{const ready=Boolean(stageRef.current&&originalImage&&(!foregroundUrl||foregroundImage)&&stageWidth>0);onExportReady(ready?exportPng:null);return()=>onExportReady(null)},[exportPng,foregroundImage,foregroundUrl,onExportReady,originalImage,stageWidth]);
  const items=[
    ...textLayers.map(layer=>({kind:"text" as LayerKind,layer})),
    ...imageLayers.map(layer=>({kind:"image" as LayerKind,layer})),
  ].sort((a,b)=>a.layer.zIndex-b.layer.zIndex);
  const renderItem=(item:typeof items[number], outline=false, passive=false)=>item.kind==="text"?<TextLayerNode key={`text-${item.layer.id}`} layer={item.layer as TextLayer} outline={outline} passive={passive} isSelected={!passive&&selectedLayer?.kind==="text"&&selectedLayer.id===item.layer.id} stageHeight={stageHeight} stageWidth={stageWidth}/>:<ImageLayerNode key={`image-${item.layer.id}`} layer={item.layer as ImageLayer} isSelected={selectedLayer?.kind==="image"&&selectedLayer.id===item.layer.id} stageHeight={stageHeight} stageWidth={stageWidth}/>;
  return <div ref={containerRef} aria-label="Image editor canvas. Select layers to drag, resize, or rotate. Double-click a layer to bring it in front of the subject." className="flex h-full min-h-[320px] w-full items-center justify-center" role="application">{originalImage&&stageWidth>0?<div className="checkerboard shrink-0 overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,.35)]" style={{width:stageWidth,height:stageHeight}}><Stage ref={stageRef} width={stageWidth} height={stageHeight} onMouseDown={(event)=>{if(event.target===event.target.getStage())selectLayer(null)}} onTouchStart={(event)=>{if(event.target===event.target.getStage())selectLayer(null)}}><Layer><FilteredImage image={originalImage} effects={effects.background} width={stageWidth} height={stageHeight}/>{items.filter(item=>item.layer.placement==="behind").map(item=>renderItem(item,false,item.kind==="text"&&(item.layer as TextLayer).textEffect==="knockout"))}{foregroundImage?<FilteredImage image={foregroundImage} effects={effects.subject} width={stageWidth} height={stageHeight}/>:null}{items.filter(item=>item.layer.placement==="front"||(item.kind==="text"&&(item.layer as TextLayer).textEffect==="knockout")).map(item=>renderItem(item,item.kind==="text"&&(item.layer as TextLayer).textEffect==="knockout"))}</Layer></Stage></div>:<div className="grid min-h-72 place-items-center text-sm text-[#686270]">Preparing canvas…</div>}</div>
}
