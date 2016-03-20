﻿using System;
using GameEngine.GameProcessor;

namespace GameEngine.MapGenerator
{
	public sealed class MapLoader
	{
		private static volatile Map _instance;
		private static object syncRoot = new Object();


		static string mapData = "222222222222222" +
		                        "200000000000002" +
		                        "202020202020202" +
		                        "200000000000002" +
		                        "202020202020202" +
		                        "200000000000002" +
		                        "202020202020202" +
		                        "200000000000002" +
		                        "202020202020202" +
		                        "200000000000002" +
		                        "200020202020202" +
		                        "200000000000002" +
		                        "222222222222222";

		private static int width = 15;
		private static int height = 13;
		private static int tileSize = 32;

		public static Map GetMap
		{
			get
			{
				if (_instance == null)
				{
					lock (syncRoot)
					{
						if (_instance == null)
							_instance = new Map(mapData, width, height, tileSize);
					}
				}

				return _instance;
			}
		}
	}
}