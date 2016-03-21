﻿using System.Collections.Concurrent;
using System.Collections.Generic;

namespace GameEngine
{
	/// <summary>
	/// State of 
	/// </summary>
	public abstract class State
	{
		public ConcurrentQueue<KeyboardState> Inputs { get; set; }
		protected Bomberman Bomberman { get; set; }
	}

	public class PlayerState : State
	{
		public Player Player
		{
			get
			{
				return Bomberman as Player;
			}
			set { Bomberman = value; }
		}
	}

	public class EnemyState : State
	{
		public Enemy Enemy
		{
			get
			{
				return Bomberman as Enemy;
			}
			set { Bomberman = value; }
		}
	}
}