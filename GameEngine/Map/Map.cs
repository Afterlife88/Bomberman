﻿using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace GameEngine.Map
{
	public class Map
	{
		private readonly Tile[] _map;
		public int TileSize { get; private set; }
		public int Width { get; private set; }
		public int Height { get; private set; }
		public List<Point> PointsToExplode = new List<Point>();
		public Map(string map, int width, int height, int tileSize)
		{
			_map = Create(map);
			Width = width;
			Height = height;
			TileSize = tileSize;
		}
		public Tile this[int x, int y]
		{
			get
			{
				return _map[GetIndex(x, y)];
			}
			set
			{
				_map[GetIndex(x, y)] = value;
			}
		}
		public bool CheckExplosion(int x, int y)
		{
			return PointsToExplode.Count != 0 && PointsToExplode.Any(item => item.X == x && item.Y == y);
		}
		private Tile[] Create(string map)
		{
			var tiles = new Tile[map.Length];
			for (int i = 0; i < map.Length; i++)
			{
				tiles[i] = (Tile)(map[i] - '0');
			}
			return tiles;
		}
		private int GetIndex(int x, int y)
		{
			return (y * Width) + x;
		}


	}
}
